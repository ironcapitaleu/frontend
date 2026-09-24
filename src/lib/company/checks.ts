import {
	type Comparison,
	type FigureRef,
	isWindow,
	meets,
	type MetricResult,
	resolve,
} from "./metrics";
import type {
	Claim,
	CompanySections,
	CompletedSections,
	Figure,
	Nullable,
} from "./types";

/** Names one check of the first check set, by its short code. */
export type CheckId =
	| "B1"
	| "B2"
	| "P1"
	| "P2"
	| "V1"
	| "V2"
	| "S1"
	| "S2"
	| "S3"
	| "C1"
	| "C2";

/** The areas of the checks, in the order of the page. */
export const checkAreas = [
	"balanceSheet",
	"profitability",
	"valuation",
	"shareholderReturns",
	"consistency",
] as const;

/** Names one area of the checks. */
export type CheckArea = (typeof checkAreas)[number];

/**
 * What a check compares its subject with: a fixed number, another figure, or
 * a count of the points of a window that meet a condition. A percent number
 * is a fraction, so 5% is `0.05`.
 */
export type Threshold =
	| {
			readonly kind: "value";
			readonly comparison: Comparison;
			readonly value: number;
	  }
	| {
			readonly kind: "figure";
			readonly comparison: Comparison;
			readonly against: FigureRef;
	  }
	| {
			readonly kind: "periodCount";
			readonly condition: Comparison;
			readonly conditionValue: number;
			readonly required: number;
	  };

/**
 * One rule that the page tests against the company's figures. `sections`
 * names the sections that the check reads. A check with an absent section
 * has not enough data.
 */
export interface Check {
	readonly id: CheckId;
	readonly area: CheckArea;
	readonly name: string;
	readonly subject: FigureRef;
	readonly threshold: Threshold;
	readonly sections: readonly (keyof CompanySections)[];
}

/** How a check ended. */
export type CheckState = "met" | "notMet" | "notEnoughData";

/** Why a check has not enough data. */
export type NotEnoughDataReason =
	| "missingSection"
	| "missingInput"
	| "failedGuard"
	| "shortHistory";

/**
 * The result of one check. `reason` is `null` unless the state is
 * `notEnoughData`. `claims` holds the claims that decided the state: the
 * subject and the threshold figure, the input of a failed guard, or the
 * points of a window.
 */
export interface CheckResult {
	readonly check: Check;
	readonly state: CheckState;
	readonly reason: Nullable<NotEnoughDataReason>;
	readonly claims: readonly Claim[];
}

/** The results of the checks of one area, and how many of them are met. */
export interface AreaSummary {
	readonly area: CheckArea;
	readonly results: readonly CheckResult[];
	readonly metCount: number;
}

const latestYear = { kind: "fiscalYear", yearsBack: 0 } as const;
const tenYears = { kind: "lastFiscalYears", count: 10 } as const;

/** Returns a reference to the metric `key` at `at`, or to the point metric `key`. */
function metric(
	key: Extract<FigureRef, { from: "metric" }>["key"],
	at: Extract<FigureRef, { from: "metric" }>["at"] = null,
): FigureRef {
	return { from: "metric", key, at };
}

/** Returns a threshold that compares the subject with the fixed `value`. */
function value(comparison: Comparison, bound: number): Threshold {
	return { kind: "value", comparison, value: bound };
}

/** Returns a threshold that compares the subject with the figure `against`. */
function figure(comparison: Comparison, against: FigureRef): Threshold {
	return { kind: "figure", comparison, against };
}

/** A period count threshold: at least 8 points of the subject window are above 0. */
const eightOfTenAboveZero: Threshold = {
	kind: "periodCount",
	condition: "above",
	conditionValue: 0,
	required: 8,
};

/** Returns a check. The positions follow the columns of the note §6 table. */
function checkOf(
	id: CheckId,
	area: CheckArea,
	name: string,
	subject: FigureRef,
	threshold: Threshold,
	sections: Check["sections"],
): Check {
	return { id, area, name, subject, threshold, sections };
}

/** The first check set of note §6, in the order of the note. */
export const checks: readonly Check[] = [
	checkOf(
		"B1",
		"balanceSheet",
		"Cash and short-term investments above total debt",
		{
			from: "line",
			key: "cashAndShortTermInvestments",
			at: { kind: "latestQuarter" },
		},
		figure("above", metric("totalDebt")),
		["financials"],
	),
	checkOf(
		"B2",
		"balanceSheet",
		"Current ratio of at least 1.5",
		metric("currentRatio"),
		value("atLeast", 1.5),
		["financials"],
	),
	checkOf(
		"P1",
		"profitability",
		"Stock-based pay below 5% of revenue",
		metric("stockPayToRevenue"),
		value("below", 0.05),
		["financials"],
	),
	checkOf(
		"P2",
		"profitability",
		"Return on equity of at least 15%",
		metric("returnOnEquity"),
		value("atLeast", 0.15),
		["financials"],
	),
	checkOf(
		"V1",
		"valuation",
		"P/E below its own 10-year median",
		metric("priceToEarnings"),
		figure("below", metric("priceToEarningsMedian10y")),
		["masthead", "financials"],
	),
	checkOf(
		"V2",
		"valuation",
		"Free cash flow yield above the 10-year Treasury yield",
		metric("freeCashFlowYield"),
		figure("above", {
			from: "market",
			key: "treasuryYield10y",
			at: { kind: "latestClose" },
		}),
		["masthead", "financials", "valuation"],
	),
	checkOf(
		"S1",
		"shareholderReturns",
		"Fewer diluted shares than five years ago",
		{ from: "line", key: "dilutedShares", at: latestYear },
		figure("below", {
			from: "line",
			key: "dilutedShares",
			at: { kind: "fiscalYear", yearsBack: 5 },
		}),
		["financials"],
	),
	checkOf(
		"S2",
		"shareholderReturns",
		"Dividend yield of at least 2%",
		metric("dividendYield"),
		value("atLeast", 0.02),
		["masthead", "financials"],
	),
	checkOf(
		"S3",
		"shareholderReturns",
		"Dividends paid within free cash flow",
		{ from: "line", key: "dividendsPaid", at: latestYear },
		figure("atMost", metric("freeCashFlow", latestYear)),
		["financials"],
	),
	checkOf(
		"C1",
		"consistency",
		"Free cash flow positive in at least 8 of 10 years",
		metric("freeCashFlow", tenYears),
		eightOfTenAboveZero,
		["financials"],
	),
	checkOf(
		"C2",
		"consistency",
		"Net income positive in at least 8 of 10 years",
		{ from: "line", key: "netIncome", at: tenYears },
		eightOfTenAboveZero,
		["financials"],
	),
];

/**
 * Evaluates every check over `sections` and groups the results by area, in
 * the order of {@link checkAreas}. No summary adds the areas together.
 */
export function evaluateChecks(
	sections: CompletedSections,
): readonly AreaSummary[] {
	const results = checks.map((one) => evaluateCheck(one, sections));
	return checkAreas.map((area) => {
		const inArea = results.filter((result) => result.check.area === area);
		return {
			area,
			results: inArea,
			metCount: inArea.filter((result) => result.state === "met").length,
		};
	});
}

/**
 * Evaluates one check by the steps of note §5. The first step that matches
 * decides: an absent section, a period count, a missing or short input, a
 * failed guard, and last the comparison. The missing input step and the
 * failed guard step read the subject first.
 */
export function evaluateCheck(
	check: Check,
	sections: CompletedSections,
): CheckResult {
	if (check.sections.some((key) => sections[key] === null)) {
		return resultOf(check, "notEnoughData", "missingSection", []);
	}
	return check.threshold.kind === "periodCount"
		? countedPeriods(check, check.threshold, sections)
		: comparedFigures(check, check.threshold, sections);
}

/**
 * Counts the points of the subject window that meet the condition of
 * `threshold`. The check is met when enough points meet it, and not met when
 * the unknown points cannot make up the difference. A point that is `null`
 * or not a finite number is unknown. A subject that is not a window has no
 * points to count, so it is a missing input.
 */
function countedPeriods(
	check: Check,
	threshold: Extract<Threshold, { kind: "periodCount" }>,
	sections: CompletedSections,
): CheckResult {
	const points = resolve(check.subject, sections, null);
	if (!isWindow(points)) {
		return resultOf(check, "notEnoughData", "missingInput", []);
	}
	const { condition, conditionValue, required } = threshold;
	const amounts = points.map((point) =>
		point === null ? Number.NaN : Number(point.value),
	);
	const metYears = amounts.filter((amount) =>
		meets(amount, condition, conditionValue),
	).length;
	const unknownYears = amounts.filter(
		(amount) => !Number.isFinite(amount),
	).length;
	if (metYears >= required) {
		return resultOf(check, "met", null, points);
	}
	return metYears + unknownYears < required
		? resultOf(check, "notMet", null, points)
		: resultOf(check, "notEnoughData", "shortHistory", points);
}

/**
 * Compares the subject with the fixed number or the figure of `threshold`,
 * after the missing input step and the failed guard step. A claim value that
 * is not a finite number is a missing input, never a failed comparison.
 */
function comparedFigures(
	check: Check,
	threshold: Exclude<Threshold, { kind: "periodCount" }>,
	sections: CompletedSections,
): CheckResult {
	const refs =
		threshold.kind === "figure"
			? [check.subject, threshold.against]
			: [check.subject];
	const inputs = refs.map((ref) =>
		asSinglePeriod(resolve(ref, sections, null)),
	);
	const claims = inputs.map((input) =>
		input.kind === "value" ? input.claim : null,
	);
	const missing = inputs.find(
		(input) => input.kind === "missingInput" || input.kind === "shortHistory",
	);
	if (missing !== undefined) {
		return resultOf(check, "notEnoughData", missing.kind, claims);
	}
	const failed = inputs.find((input) => input.kind === "failedGuard");
	if (failed !== undefined) {
		return resultOf(check, "notEnoughData", "failedGuard", [failed.input]);
	}
	const [amount, figureBound] = claims.map((claim) => Number(claim?.value));
	const bound = threshold.kind === "figure" ? figureBound : threshold.value;
	if (!Number.isFinite(amount) || !Number.isFinite(bound)) {
		return resultOf(check, "notEnoughData", "missingInput", claims);
	}
	const met = meets(amount, threshold.comparison, bound);
	return resultOf(check, met ? "met" : "notMet", null, claims);
}

/** Maps a window to `missingInput`, so a single-period step never reads one. */
function asSinglePeriod(input: MetricResult | readonly Figure[]): MetricResult {
	return isWindow(input) ? { kind: "missingInput" } : input;
}

/** Returns the result of `check`, with the claims of the figures that are not `null`. */
function resultOf(
	check: Check,
	state: CheckState,
	reason: Nullable<NotEnoughDataReason>,
	claims: readonly Figure[],
): CheckResult {
	return {
		check,
		state,
		reason,
		claims: claims.filter((claim) => claim !== null),
	};
}
