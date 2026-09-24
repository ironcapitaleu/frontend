import type {
	MarketDataset,
	MetricKey,
	Period,
	ValuationSection,
} from "../types";
import { dateInstant, isoDate, periodId } from "./calendar";
import { meridianMasthead } from "./masthead";
import { type Spread, sectorBenchmark } from "./peers";
import { reported } from "./sources";

/** The daily 10-year Treasury par yields, up to 23 Sep 2026. */
export const treasuryYields: MarketDataset = {
	kind: "market",
	name: "Daily Treasury par yield curve rates",
	asOf: isoDate("2026-09-23"),
	url: "https://treasury.example/par-yield-curve",
};

// The 10-year Treasury yield in percent at each fiscal year end, FY2017 to
// FY2026, from the mock-up. A fiscal year ends on a Sunday, so each figure is
// the close of the last trading day before it.
const YIELD_AT_YEAR_ENDS = [
	2.45, 2.72, 2.63, 1.51, 1.11, 1.78, 3.52, 4.14, 4.54, 4.24,
];
const YIELD_NOW = 4.1;

function treasuryYield(
	key: string,
	label: string,
	percent: number,
	period: Period,
) {
	return reported(
		{
			id: `valuation.${key}.${periodId(period)}`,
			label,
			value: Math.round(percent * 100) / 10_000,
			unit: "percent",
			period,
		},
		treasuryYields,
		{ path: "10-year par yield", xbrlTag: null },
	);
}

// The lowest peer, the quartiles and the highest peer of each ratio, from
// the mock-up.
type ValuationMetric = Extract<
	MetricKey,
	| "priceToEarnings"
	| "priceToFreeCashFlow"
	| "priceToBook"
	| "enterpriseValueToEbit"
>;
const SECTOR_SPREAD: Record<ValuationMetric, Spread> = {
	priceToEarnings: [8.5, 22.6, 31.4, 44.0, 120.0],
	priceToFreeCashFlow: [9.0, 24.1, 35.2, 51.3, 140.0],
	priceToBook: [1.1, 2.9, 5.1, 9.8, 42.0],
	enterpriseValueToEbit: [7.0, 18.5, 26.8, 38.9, 95.0],
};
const METRIC_LABELS: Record<ValuationMetric, string> = {
	priceToEarnings: "P/E",
	priceToFreeCashFlow: "P/FCF",
	priceToBook: "P/B",
	enterpriseValueToEbit: "EV/EBIT",
};

/**
 * The Valuation data of Meridian: the 10-year Treasury yield at each fiscal
 * year end and on 23 Sep 2026, and the sector quartiles of the four ratios.
 * The yield series has the periods of the year-end price series, so a yield
 * pairs with the price of the same year.
 */
export const meridianValuation: ValuationSection = {
	treasuryYieldAtFiscalYearEnds: {
		key: "treasuryYieldAtFiscalYearEnds",
		label: "10-year Treasury yield at fiscal year end",
		unit: "percent",
		periods: meridianMasthead.priceAtFiscalYearEnds.periods,
		points: meridianMasthead.priceAtFiscalYearEnds.periods.map(
			(period, position) =>
				treasuryYield(
					"treasuryYieldAtFiscalYearEnds",
					"10-year Treasury yield at fiscal year end",
					YIELD_AT_YEAR_ENDS[position],
					period,
				),
		),
	},
	treasuryYieldNow: treasuryYield(
		"treasuryYieldNow",
		"10-year Treasury yield",
		YIELD_NOW,
		dateInstant("2026-09-23"),
	),
	sectorBenchmarks: (Object.keys(SECTOR_SPREAD) as ValuationMetric[]).map(
		(metric) =>
			sectorBenchmark(
				"valuation",
				metric,
				METRIC_LABELS[metric],
				SECTOR_SPREAD[metric],
				"ratio",
				METRIC_LABELS[metric],
			),
	),
};
