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

/** The year-end metric and the 10-year median metric of each ratio. */
const ownHistory: Record<
	(typeof valuationRatios)[number],
	Record<"atYearEnd" | "median", MetricKey>
> = {
	priceToEarnings: {
		atYearEnd: "priceToEarningsAtYearEnd",
		median: "priceToEarningsMedian10y",
	},
	priceToFreeCashFlow: {
		atYearEnd: "priceToFreeCashFlowAtYearEnd",
		median: "priceToFreeCashFlowMedian10y",
	},
	priceToBook: {
		atYearEnd: "priceToBookAtYearEnd",
		median: "priceToBookMedian10y",
	},
	enterpriseValueToEbit: {
		atYearEnd: "enterpriseValueToEbitAtYearEnd",
		median: "enterpriseValueToEbitMedian10y",
	},
};

/**
 * The least number of year-end figures the own range needs. It is the
 * `minPoints` of the 10-year median metrics, so the range and its median
 * appear together.
 */
export const MIN_YEARS = 5;

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
 * and median, and the sector quartiles. The range needs at least
 * {@link MIN_YEARS} year-end figures, and otherwise its ends are missing
 * (DESIGN.md §8).
 */
export function ratioRanges(sections: CompletedSections): RatioRange[] {
	return valuationRatios.map((ratio) => {
		const history = ownHistory[ratio];
		const years = yearEndFigures(history.atYearEnd, sections);
		const sorted = [...years].sort((a, b) => Number(a.value) - Number(b.value));
		const ranged = sorted.length >= MIN_YEARS;
		return {
			ratio,
			now: claimOf(evaluateMetric(ratio, sections)),
			ownLow: ranged ? (sorted.at(0) ?? null) : null,
			ownMedian: claimOf(evaluateMetric(history.median, sections)),
			ownHigh: ranged ? (sorted.at(-1) ?? null) : null,
			sector:
				sections.valuation?.sectorBenchmarks.find(
					(benchmark) => benchmark.metric === ratio,
				) ?? null,
		};
	});
}

/**
 * Returns the lowest and highest known figure of both bars of `range`,
 * medians included, so the two bars share one scale and the figure now sits
 * at one place on both. Returns `null` when no figure is known.
 */
export function ratioScale(range: RatioRange): Nullable<[number, number]> {
	const { now, ownLow, ownMedian, ownHigh, sector } = range;
	const values = [now, ownLow, ownMedian, ownHigh]
		.concat(
			sector ? [sector.lowerQuartile, sector.median, sector.upperQuartile] : [],
		)
		.flatMap((figure) => (figure === null ? [] : [Number(figure.value)]));
	return values.length === 0
		? null
		: [Math.min(...values), Math.max(...values)];
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
