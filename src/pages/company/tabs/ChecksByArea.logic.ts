import { formatInput, formatInUnit } from "@/components/company/format";
import {
	type CheckId,
	type CheckResult,
	figureRefsOf,
	type NotEnoughDataReason,
} from "@/lib/company/checks";
import {
	type Comparison,
	isWindow,
	meets,
	metrics,
	resolve,
} from "@/lib/company/metrics";
import type { Claim, CompletedSections, Figure } from "@/lib/company/types";

/** A part of a check sentence: plain text, or a figure that opens its sources. */
export type SentencePart =
	| string
	| {
			readonly key: "subject" | "against" | "guard" | "count";
			readonly figure: Figure;
			/** Writes the figure's number, in the unit of the figure. */
			readonly format: (value: number) => string;
	  };

/** The words of each check: its subject, and the figure it is compared with. */
const TERMS: Record<CheckId, { subject: string; against?: string }> = {
	B1: { subject: "Cash and short-term investments", against: "total debt" },
	B2: { subject: "The current ratio" },
	P1: { subject: "Stock-based pay as a share of revenue" },
	P2: { subject: "Return on equity" },
	V1: { subject: "The P/E", against: "its own 10-year median" },
	V2: {
		subject: "The free cash flow yield",
		against: "the 10-year Treasury yield",
	},
	S1: {
		subject: "Diluted shares in the latest fiscal year",
		against: "five fiscal years earlier",
	},
	S2: { subject: "The dividend yield" },
	S3: {
		subject: "Dividends paid in the latest fiscal year",
		against: "free cash flow",
	},
	C1: { subject: "Free cash flow" },
	C2: { subject: "Net income" },
};

const COMPARISON_WORDS: Record<Comparison, string> = {
	above: "above",
	atLeast: "at least",
	below: "below",
	atMost: "at most",
};

const REASON_WORDS: Record<NotEnoughDataReason, string> = {
	missingSection: "a section has not loaded yet",
	missingInput: "a figure is missing",
	failedGuard: "a figure has no reading",
	shortHistory: "the history is too short",
};

/**
 * Returns the sentence of `result`: the rule with its threshold and the
 * company's figures inside it (DESIGN.md §8). A failed guard names the input
 * that failed. A period count shows the count of years as a claim, derived
 * from the points of the window.
 */
export function sentenceOf(
	result: CheckResult,
	sections: CompletedSections,
): SentencePart[] {
	const { check, state, reason } = result;
	const { subject, against } = TERMS[check.id];
	const { threshold } = check;
	const guard = result.claims[0] ?? null;
	if (reason === "failedGuard") {
		return [
			`${guard?.label ?? subject} is `,
			claimPart("guard", guard),
			", not above 0, so the check has no reading.",
		];
	}
	if (threshold.kind === "periodCount") {
		const window = resolve(check.subject, sections, null);
		const points = isWindow(window) ? window : [];
		const { condition, conditionValue, required } = threshold;
		const rule = `${COMPARISON_WORDS[condition]} ${conditionValue}`;
		return [
			`${subject} was ${rule} in `,
			{
				key: "count",
				figure: countClaim(check.id, `${subject} ${rule}`, points, (value) =>
					meets(value, condition, conditionValue),
				),
				format: (count) => `${count} of ${points.length} years`,
			},
			`. The rule asks for at least ${required}${reason ? `, but ${REASON_WORDS[reason]}` : ""}.`,
		];
	}
	const [figure = null, bound = null] = figureRefsOf(check).map((ref) => {
		const one = resolve(ref, sections, null);
		return !isWindow(one) && one.kind === "value" ? one.claim : null;
	});
	const words = COMPARISON_WORDS[threshold.comparison];
	const verb = { met: "is", notMet: "is not", notEnoughData: "needs to be" }[
		state
	];
	// Every check with a fixed threshold tests a metric, so its unit writes the number.
	const unit =
		check.subject.from === "metric" ? metrics[check.subject.key].unit : "ratio";
	const tail: SentencePart[] =
		threshold.kind === "value"
			? [`the threshold of ${formatInUnit(threshold.value, unit)}`]
			: [`${against} (`, claimPart("against", bound), ")"];
	return [
		`${subject} (`,
		claimPart("subject", figure),
		`) ${verb} ${words} `,
		...tail,
		reason ? `, but ${REASON_WORDS[reason]}.` : ".",
	];
}

/**
 * Returns the part of a sentence that holds `figure`, written by
 * `formatInput` in the figure's own unit, such as `−$1.20` for a loss per
 * share.
 */
function claimPart(
	key: "subject" | "against" | "guard",
	figure: Figure,
): SentencePart {
	return {
		key,
		figure,
		format: (value) => formatInput({ value, unit: figure?.unit ?? "ratio" }),
	};
}

/**
 * Returns the claim `check.{id}.count`: how many points of `points` pass
 * `test`, with the points as its inputs. Returns `null` when no point has a
 * claim.
 */
function countClaim(
	id: CheckId,
	label: string,
	points: readonly Figure[],
	test: (value: number) => boolean,
): Figure {
	const [first, ...rest] = points.filter((point) => point !== null);
	if (first === undefined) return null;
	const inputs: [Claim, ...Claim[]] = [first, ...rest];
	return {
		id: `check.${id}.count`,
		label: `${label}, years`,
		value: inputs.filter(({ value }) => test(Number(value))).length,
		unit: "count",
		period: null,
		source: { kind: "derived", formula: `Count of years ${label}`, inputs },
	};
}

/** Returns the claims of the figures in `sentence`, for its source line. */
export function sentenceClaims(sentence: readonly SentencePart[]): Claim[] {
	return sentence.flatMap((part) =>
		typeof part !== "string" && part.figure !== null ? [part.figure] : [],
	);
}
