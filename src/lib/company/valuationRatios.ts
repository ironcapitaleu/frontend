import { evaluateMetric, isWindow, resolve } from "./metrics";
import type {
	Claim,
	CompletedSections,
	Figure,
	MetricKey,
	Nullable,
	SectorBenchmark,
} from "./types";

/** The four ratios of card 3.1, in the order of DESIGN.md §8 "Valuation". */
export const valuationRatios = [
	"priceToEarnings",
	"priceToFreeCashFlow",
	"priceToBook",
	"enterpriseValueToEbit",
] as const satisfies readonly MetricKey[];

/**
 * The year-end metric and the 10-year median metric of each ratio. Only the
 * P/E has them in `metrics.ts` so far, so the other ratios show their own
 * range as missing.
 */
const ownHistory: Partial<
	Record<
		(typeof valuationRatios)[number],
		Record<"atYearEnd" | "median", MetricKey>
	>
> = {
	priceToEarnings: {
		atYearEnd: "priceToEarningsAtYearEnd",
		median: "priceToEarningsMedian10y",
	},
};

/** One ratio now, against its own ten years and against the sector. */
export interface RatioRange {
	readonly ratio: (typeof valuationRatios)[number];
	readonly now: Figure;
	/** The lowest year-end figure of the last ten fiscal years. */
	readonly ownLow: Figure;
	readonly ownMedian: Figure;
	/** The highest year-end figure of the last ten fiscal years. */
	readonly ownHigh: Figure;
	readonly sector: Nullable<SectorBenchmark>;
}

/**
 * Returns each ratio of card 3.1 with its figure now, its own 10-year range
 * and median, and the sector quartiles. The range needs at least two
 * year-end figures, and otherwise its ends are missing (DESIGN.md §8).
 */
export function ratioRanges(sections: CompletedSections): RatioRange[] {
	return valuationRatios.map((ratio) => {
		const history = ownHistory[ratio];
		const years = history ? yearEndFigures(history.atYearEnd, sections) : [];
		const sorted = [...years].sort((a, b) => Number(a.value) - Number(b.value));
		const ranged = sorted.length >= 2;
		return {
			ratio,
			now: claimOf(evaluateMetric(ratio, sections)),
			ownLow: ranged ? sorted[0] : null,
			ownMedian: history
				? claimOf(evaluateMetric(history.median, sections))
				: null,
			ownHigh: ranged ? (sorted.at(-1) ?? null) : null,
			sector:
				sections.valuation?.sectorBenchmarks.find(
					(benchmark) => benchmark.metric === ratio,
				) ?? null,
		};
	});
}

/**
 * Returns the lowest and highest known figure of both bars of `range`, so the
 * two bars share one scale and the figure now sits at one place on both.
 */
export function ratioScale(range: RatioRange): [number, number] {
	const { now, ownLow, ownHigh, sector } = range;
	const values = [now, ownLow, ownHigh]
		.concat(sector ? [sector.lowerQuartile, sector.upperQuartile] : [])
		.flatMap((figure) => (figure === null ? [] : [Number(figure.value)]));
	return [Math.min(...values), Math.max(...values)];
}

/** Returns the claims of the year-end metric `key` over the last ten fiscal years. */
function yearEndFigures(key: MetricKey, sections: CompletedSections): Claim[] {
	const window = resolve(
		{ from: "metric", key, at: { kind: "lastFiscalYears", count: 10 } },
		sections,
		null,
	);
	return isWindow(window) ? window.filter((figure) => figure !== null) : [];
}

function claimOf(result: ReturnType<typeof evaluateMetric>): Figure {
	return result.kind === "value" ? result.claim : null;
}
