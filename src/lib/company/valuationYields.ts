import {
	type FigureRef,
	isWindow,
	nestedMetricInputsOf,
	resolve,
} from "./metrics";
import type { CompletedSections, Figure, Nullable, Period } from "./types";

/**
 * The yields of card 3.2. A column is a fiscal year end, or now with no
 * `period`. `label` is its full name, such as `FY2026`, and `short` its axis
 * label, such as `FY26`. A line holds one yield in each column.
 */
export interface YieldTable {
	readonly columns: readonly {
		key: string;
		label: string;
		short: string;
		period: Nullable<Period>;
	}[];
	readonly lines: readonly { key: string; label: string; points: Figure[] }[];
}

const atYearEnd = { kind: "samePeriod" } as const;
const treasury = "treasuryYield10y";

/** The three yields in legend order, each at a fiscal year end and now. */
const yields: readonly [string, string, FigureRef, FigureRef][] = [
	[
		"earningsYield",
		"Earnings yield",
		{ from: "metric", key: "earningsYieldAtYearEnd", at: atYearEnd },
		{ from: "metric", key: "earningsYield", at: null },
	],
	[
		"freeCashFlowYield",
		"FCF yield",
		{ from: "metric", key: "freeCashFlowYieldAtYearEnd", at: atYearEnd },
		{ from: "metric", key: "freeCashFlowYield", at: null },
	],
	[
		treasury,
		"10-year Treasury",
		{ from: "market", key: treasury, at: atYearEnd },
		{ from: "market", key: treasury, at: { kind: "latestClose" } },
	],
];

/**
 * Returns the yields of card 3.2 (DESIGN.md §8 "Valuation"): one column for
 * each of the last ten fiscal year ends, oldest first, and a last column for
 * now. A yield with no figure, such as one whose year-end price is missing,
 * is `null` in its column.
 */
export function yieldTable(sections: CompletedSections): YieldTable {
	const years = sections.financials?.income.annual.periods.slice(-10) ?? [];
	const columns = [
		...years.map((period) => ({
			key: period.endsOn,
			label: `FY${period.fiscalYear}`,
			short: `FY${String(period.fiscalYear).slice(-2)}`,
			period,
		})),
		{ key: "now", label: "Now", short: "Now", period: null },
	];
	return {
		columns,
		lines: yields.map(([key, label, yearEnd, now]) => ({
			key,
			label,
			points: columns.map(({ period }) =>
				figureOf(period ? yearEnd : now, sections, period),
			),
		})),
	};
}

/**
 * Returns each yield of card 3.2, or the inputs of a missing one at every
 * depth, so its filings stay in the sources index.
 */
export function yieldClaimsOf(sections: CompletedSections): Figure[] {
	const { columns, lines } = yieldTable(sections);
	return lines.flatMap(({ points }, row) =>
		points.flatMap((point, position) => {
			const period = columns[position]?.period ?? null;
			const [, , yearEnd, now] = yields[row] ?? [];
			const ref = period ? yearEnd : now;
			return point !== null || ref?.from !== "metric"
				? [point]
				: nestedMetricInputsOf(ref.key, sections, period);
		}),
	);
}

/** Returns the claim that `ref` names at `period`, or `null`. */
function figureOf(
	ref: FigureRef,
	sections: CompletedSections,
	period: Nullable<Period>,
): Figure {
	const result = resolve(ref, sections, period);
	return !isWindow(result) && result.kind === "value" ? result.claim : null;
}
