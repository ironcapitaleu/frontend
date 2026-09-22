// Maps the filter rail's sliders to the string fields of `FilterState` and
// back. Kept pure so the mapping tests with a single `toEqual` and the rail
// component stays a thin shell.

import type {
	DistributionSliderProps,
	SliderRange,
} from "@/components/ui/distribution-slider";
import {
	countActiveFilters,
	type FilterState,
	isActiveNumericFilter,
	type Stock,
} from "@/pages/public/StockScreener.logic";

/** The `Stock` fields that hold a number the rail can chart. */
type NumericStockField =
	| "peRatio"
	| "priceToFcf"
	| "priceToCash"
	| "quickRatio"
	| "currentRatio"
	| "dividendYield"
	| "buybackYield"
	| "changePercent1M";

/** The `FilterState` fields that hold a numeric bound as a string. */
type BoundField = Exclude<
	keyof FilterState,
	"search" | "country" | "sector" | "nearFiftyTwoWeekLow"
>;

/** One metric in the rail: which data it charts and which filters it sets. */
export interface RailMetric {
	readonly label: string;
	readonly stockField: NumericStockField;
	/** The filter the lower thumb sets, or `null` when the metric has no lower bound. */
	readonly lowerField: BoundField | null;
	/** The filter the upper thumb sets, or `null` when the metric has no upper bound. */
	readonly upperField: BoundField | null;
	/**
	 * Set when the upper filter stores the bound with its sign flipped.
	 * `downLastMonth` stores "down at least 3%" as `3`, which is an upper bound
	 * of −3 on the 1M change.
	 */
	readonly negatesUpper?: boolean;
	readonly min: number;
	readonly max: number;
	readonly step: number;
	readonly unit: "" | "%";
}

/** A titled group of metrics, one section of the rail. */
export interface RailGroup {
	readonly title: string;
	readonly metrics: readonly RailMetric[];
}

/** The rail's metric sections, top to bottom. */
export const RAIL_GROUPS: readonly RailGroup[] = [
	{
		title: "Valuation",
		metrics: [
			{
				label: "P/E",
				stockField: "peRatio",
				lowerField: "peMin",
				upperField: "peMax",
				min: 0,
				max: 40,
				step: 0.5,
				unit: "",
			},
			{
				label: "P/FCF",
				stockField: "priceToFcf",
				lowerField: null,
				upperField: "priceToFcfMax",
				min: 0,
				max: 45,
				step: 0.5,
				unit: "",
			},
			{
				label: "P/Cash",
				stockField: "priceToCash",
				lowerField: null,
				upperField: "priceToCashMax",
				min: 0,
				max: 30,
				step: 0.5,
				unit: "",
			},
		],
	},
	{
		title: "Balance sheet",
		metrics: [
			{
				label: "Quick ratio",
				stockField: "quickRatio",
				lowerField: "quickRatioMin",
				upperField: null,
				min: 0,
				max: 3,
				step: 0.05,
				unit: "",
			},
			{
				label: "Current ratio",
				stockField: "currentRatio",
				lowerField: "currentRatioMin",
				upperField: null,
				min: 0,
				max: 3,
				step: 0.05,
				unit: "",
			},
		],
	},
	{
		title: "Shareholder yield",
		metrics: [
			{
				label: "Dividend yield",
				stockField: "dividendYield",
				lowerField: "dividendYieldMin",
				upperField: null,
				min: 0,
				max: 8,
				step: 0.1,
				unit: "%",
			},
			{
				label: "Buyback yield",
				stockField: "buybackYield",
				lowerField: "buybackYieldMin",
				upperField: null,
				min: 0,
				max: 6,
				step: 0.1,
				unit: "%",
			},
		],
	},
	{
		title: "Momentum",
		metrics: [
			{
				label: "1M change",
				stockField: "changePercent1M",
				lowerField: null,
				upperField: "downLastMonth",
				negatesUpper: true,
				min: -15,
				max: 5,
				step: 0.5,
				unit: "%",
			},
		],
	},
];

/** Which thumbs the metric's slider draws. */
export function metricBounds(
	metric: RailMetric,
): NonNullable<DistributionSliderProps["bounds"]> {
	if (metric.lowerField && metric.upperField) return "both";
	return metric.upperField ? "upper" : "lower";
}

/**
 * The ends of the metric's track. A bound that lies outside the usual track
 * widens it, so the slider shows the bound instead of hiding it at an end.
 */
export function metricTrack(
	metric: RailMetric,
	filters: FilterState,
): SliderRange {
	const bounds = readBounds(metric, filters).filter(
		(bound): bound is number => bound !== null,
	);
	return [Math.min(metric.min, ...bounds), Math.max(metric.max, ...bounds)];
}

/**
 * The slider range that `filters` sets for `metric`. A missing or unparsable
 * bound rests the thumb at its end of the track. A lower bound above the upper
 * one rests on the upper one, so the range never inverts.
 */
export function metricRange(
	metric: RailMetric,
	filters: FilterState,
): SliderRange {
	const [trackMin, trackMax] = metricTrack(metric, filters);
	const [lowerBound, upperBound] = readBounds(metric, filters);
	const upper = upperBound ?? trackMax;
	const lower = Math.min(lowerBound ?? trackMin, upper);
	return [lower, upper];
}

/**
 * Returns `filters` with the bounds of `metric` set from `range`. Only a thumb
 * that moved writes its filter, so a bound the reader did not touch stays as
 * it was. A thumb moved to its end of the track clears its filter.
 */
export function applyMetricRange(
	metric: RailMetric,
	filters: FilterState,
	[lower, upper]: SliderRange,
): FilterState {
	const [trackMin, trackMax] = metricTrack(metric, filters);
	const [shownLower, shownUpper] = metricRange(metric, filters);
	const next = { ...filters };
	if (metric.lowerField && lower !== shownLower) {
		next[metric.lowerField] = lower > trackMin ? formatBound(lower) : "";
	}
	if (metric.upperField && upper !== shownUpper) {
		const bound = metric.negatesUpper ? -upper : upper;
		next[metric.upperField] = upper < trackMax ? formatBound(bound) : "";
	}
	return next;
}

/** The distinct values of a text field across `stocks`, sorted. */
export function distinctValues(
	stocks: readonly Stock[],
	field: "country" | "sector",
): string[] {
	return [...new Set(stocks.map((stock) => stock[field]))].sort((a, b) =>
		a.localeCompare(b),
	);
}

/**
 * Whether any criterion that the rail renders is active. The search lives in
 * the masthead, so it does not count here.
 */
export function hasActiveFilters(filters: FilterState): boolean {
	return countActiveFilters({ ...filters, search: "" }) > 0;
}

/** The metric's lower and upper bound as numbers on the track, or `null`. */
function readBounds(
	metric: RailMetric,
	filters: FilterState,
): [number | null, number | null] {
	const upper = readBound(filters, metric.upperField);
	return [
		readBound(filters, metric.lowerField),
		upper !== null && metric.negatesUpper ? -upper : upper,
	];
}

function readBound(
	filters: FilterState,
	field: BoundField | null,
): number | null {
	if (!field) return null;
	const value = filters[field];
	return isActiveNumericFilter(value) ? parseFloat(value) : null;
}

function formatBound(value: number): string {
	return String(Number(value.toFixed(2)));
}
