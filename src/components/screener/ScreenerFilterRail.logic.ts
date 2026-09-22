// Maps the filter rail's sliders to the string fields of `FilterState` and
// back. Kept pure so the mapping tests with a single `toEqual` and the rail
// component stays a thin shell.

import type { Range } from "@/components/ui/distribution-slider";
import {
	EMPTY_FILTERS,
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

/** One metric in the rail: which data it charts and which filters it sets. */
export interface RailMetric {
	readonly label: string;
	readonly stockField: NumericStockField;
	/** The filter the lower thumb sets, or `null` when the metric has no lower bound. */
	readonly lowerField: keyof FilterState | null;
	/** The filter the upper thumb sets, or `null` when the metric has no upper bound. */
	readonly upperField: keyof FilterState | null;
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

/** The rail's sections, top to bottom, in the order of the table's column groups. */
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
export function metricBounds(metric: RailMetric): "both" | "upper" | "lower" {
	if (metric.lowerField && metric.upperField) return "both";
	return metric.upperField ? "upper" : "lower";
}

/**
 * The slider range that `filters` sets for `metric`. A missing or unparsable
 * bound rests the thumb at its end of the track, and a bound outside the track
 * clamps to it.
 */
export function metricRange(metric: RailMetric, filters: FilterState): Range {
	const lower = readBound(filters, metric.lowerField, false) ?? metric.min;
	const upper =
		readBound(filters, metric.upperField, metric.negatesUpper ?? false) ??
		metric.max;
	return [clamp(lower, metric), clamp(upper, metric)];
}

/**
 * Returns `filters` with the bounds of `metric` set from `range`. A thumb at
 * its end of the track clears its filter, so dragging a thumb back to the end
 * removes the bound.
 */
export function applyMetricRange(
	metric: RailMetric,
	filters: FilterState,
	[lower, upper]: Range,
): FilterState {
	const next = { ...filters };
	if (metric.lowerField) {
		next[metric.lowerField] = lower > metric.min ? formatBound(lower) : "";
	}
	if (metric.upperField) {
		const bound = metric.negatesUpper ? -upper : upper;
		next[metric.upperField] = upper < metric.max ? formatBound(bound) : "";
	}
	return next as FilterState;
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

/** Whether any criterion in `filters` differs from the empty state. */
export function hasActiveFilters(filters: FilterState): boolean {
	return (Object.keys(EMPTY_FILTERS) as (keyof FilterState)[]).some(
		(field) => filters[field] !== EMPTY_FILTERS[field],
	);
}

function readBound(
	filters: FilterState,
	field: keyof FilterState | null,
	negate: boolean,
): number | null {
	if (!field) return null;
	const value = filters[field];
	if (typeof value !== "string" || !isActiveNumericFilter(value)) return null;
	const bound = parseFloat(value);
	return negate ? -bound : bound;
}

function clamp(value: number, metric: RailMetric): number {
	return Math.min(metric.max, Math.max(metric.min, value));
}

function formatBound(value: number): string {
	return String(Number(value.toFixed(2)));
}
