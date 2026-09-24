import type { SharePart } from "@/components/company/ShareBar";
import { formatMarketCap, formatPercent } from "@/components/screener/format";
import {
	evaluateMetric,
	otherRevenueShare,
	revenueShare,
} from "@/lib/company/metrics";
import type {
	CompletedSections,
	LineKey,
	MetricKey,
	OverviewSection,
	Series,
	Unit,
} from "@/lib/company/types";

/** The most parts a `ShareBar` draws, one for each chart color of DESIGN.md §8. */
const MAX_PARTS = 5;

/**
 * Returns one part for each row of the `list` of `overview`: the row's name
 * and its share of revenue from `revenueShare`. A list of more than five rows
 * keeps its first four and folds the rest into one "Other" part, whose share
 * comes from `otherRevenueShare`, so the bar never repeats a color.
 */
export function revenueParts(
	overview: OverviewSection,
	list: "segments" | "regions",
): SharePart[] {
	const rows = overview[list];
	const named = rows.length > MAX_PARTS ? rows.slice(0, MAX_PARTS - 1) : rows;
	const parts = named.map((part, position) => ({
		label: part.name,
		share: revenueShare(overview, list, position),
	}));
	if (named.length === rows.length) return parts;
	return [
		...parts,
		{ label: "Other", share: otherRevenueShare(overview, list, named.length) },
	];
}

/** One series of "Ten Years at a Glance": a statement line or a metric. */
type TenYearsSource = { readonly label: string; readonly unit: Unit } & (
	| { readonly line: LineKey }
	| { readonly metric: MetricKey }
);

/** The four series of "Ten Years at a Glance", in the order of DESIGN.md §8. */
const TEN_YEARS: readonly TenYearsSource[] = [
	{ line: "revenue", label: "Revenue", unit: "usd" },
	{ metric: "operatingMargin", label: "Operating margin", unit: "percent" },
	{ metric: "freeCashFlow", label: "Free cash flow", unit: "usd" },
	{ line: "dilutedShares", label: "Diluted shares", unit: "shares" },
];

/**
 * Returns the four series of "Ten Years at a Glance" over the fiscal years of
 * the annual income statement. A metric gets one point for each year from
 * `evaluateMetric`, and a year without a value gets a `null` point. A line
 * that the table lacks gets `null` points. Returns an empty list until
 * Financials loads.
 */
export function tenYearsSeries(sections: CompletedSections): Series[] {
	const { financials } = sections;
	if (financials === null) return [];
	const { periods, lines } = financials.income.annual;
	return TEN_YEARS.map(({ label, unit, ...source }) => {
		if ("line" in source) {
			const line = lines.find(({ key }) => key === source.line);
			const points = line?.points ?? periods.map(() => null);
			return { key: source.line, label, unit, periods, points };
		}
		const points = periods.map((period) => {
			const result = evaluateMetric(source.metric, sections, period);
			return result.kind === "value" ? result.claim : null;
		});
		return { key: source.metric, label, unit, periods, points };
	});
}

/**
 * Writes a value of a series in its unit: `$212.0B` for dollars, `24.5B` for
 * a share count and `31.2%` for a percent, which the series holds as a
 * fraction. A loss takes a true minus, such as `−$4.0B`.
 */
export function formatInUnit(value: number, unit: Unit): string {
	if (unit === "percent") return formatPercent(value * 100);
	const sign = value < 0 ? "−" : "";
	const amount = formatMarketCap(Math.abs(value));
	return `${sign}${unit === "usd" ? amount : amount.slice(1)}`;
}
