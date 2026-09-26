import { formatInUnit } from "@/components/company/format";
import { type BarBox, barBoxes } from "@/components/company/MiniBarChart";
import type { SharePart } from "@/components/company/ShareBar";
import { MISSING } from "@/components/screener/format";
import type { CompanySectionKey, CompanyState } from "@/hooks/useCompany";
import {
	evaluateMetric,
	otherRevenueShare,
	ownershipShares,
	type PositionRow,
	revenueShare,
} from "@/lib/company/metrics";
import type {
	CompletedSections,
	Figure,
	LineKey,
	MetricKey,
	OverviewSection,
	Nullable,
	OwnershipSummary,
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

/**
 * Returns the three parts of an ownership bar, from `ownershipShares`:
 * institutions, insiders and the public. Overview card 1.6 and Relationships
 * card 5.3 both draw these parts, so the two bars cannot differ. The public
 * share is `null` when institutions and insiders hold more than the shares
 * outstanding, so it prints the dimmed dash and draws no segment. A share
 * above 100% keeps its true value, and `ShareBar` shrinks the segments in
 * step so the bar never overflows.
 */
export function ownershipParts(
	section: { readonly ownership: OwnershipSummary },
	owner: "overview" | "relationships",
): SharePart[] {
	const shares = ownershipShares(section, owner);
	return [
		{ label: "Institutions", share: shares.institutions },
		{ label: "Insiders", share: shares.insiders },
		{ label: "Public", share: shares.public },
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
 * The lines and metrics of region 4 "Ten years of results" of the printed
 * page (DESIGN.md §8 "Print Summary"): the main income, cash flow and share
 * lines, in this order.
 */
const RESULTS: readonly TenYearsSource[] = [
	{ line: "revenue", label: "Revenue", unit: "usd" },
	{ line: "operatingIncome", label: "Operating income", unit: "usd" },
	{ metric: "operatingMargin", label: "Operating margin", unit: "percent" },
	{ line: "netIncome", label: "Net income", unit: "usd" },
	{ line: "dilutedEps", label: "Diluted EPS", unit: "usdPerShare" },
	{ line: "operatingCashFlow", label: "Operating cash flow", unit: "usd" },
	{ line: "capitalExpenditure", label: "Capital expenditure", unit: "usd" },
	{ metric: "freeCashFlow", label: "Free cash flow", unit: "usd" },
	{ line: "dividendsPaid", label: "Dividends paid", unit: "usd" },
	{ line: "shareRepurchases", label: "Share repurchases", unit: "usd" },
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
	return annualSeries(TEN_YEARS, sections);
}

/**
 * Returns the series of region 4 "Ten years of results" of the printed page,
 * by the rules of {@link tenYearsSeries}. A line comes from the annual income
 * statement or the annual cash flow statement.
 */
export function resultsSeries(sections: CompletedSections): Series[] {
	return annualSeries(RESULTS, sections);
}

/** Returns one series for each of `sources` over the fiscal years of the annual income statement. */
function annualSeries(
	sources: readonly TenYearsSource[],
	sections: CompletedSections,
): Series[] {
	const { financials } = sections;
	if (financials === null) return [];
	const { periods } = financials.income.annual;
	const tables = [financials.income.annual, financials.cashFlow.annual];
	return sources.map(({ label, unit, ...source }) => {
		if ("line" in source) {
			// A cash flow line takes the point of the same fiscal year.
			const table = tables.find(({ lines }) =>
				lines.some(({ key }) => key === source.line),
			);
			const line = table?.lines.find(({ key }) => key === source.line);
			const points = periods.map(({ fiscalYear }) => {
				const at = table?.periods.findIndex(
					(period) => period.fiscalYear === fiscalYear,
				);
				return (at === undefined ? null : line?.points[at]) ?? null;
			});
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
 * Joins the sections that several `useCompany` loads return into one
 * `CompletedSections`, so a card can read the figures of several sections.
 * A section that none of `loaded` holds stays `null`. Returns `null` when
 * `loaded` holds no sections.
 */
export function joinSections(
	loaded: readonly Nullable<CompletedSections>[],
): Nullable<CompletedSections> {
	const found = loaded.filter((sections) => sections !== null);
	const [first] = found;
	if (first === undefined) return null;
	const parts = found.flatMap((sections) =>
		Object.entries(sections).filter(([, part]) => part !== null),
	);
	return { ...first, ...Object.fromEntries(parts) };
}

/**
 * Returns the state of the `lead` load, held back until each load of
 * `others` has loaded too. It is loading while one of them loads, and failed
 * when one of them is missing or fails. Card 1.3 leads with Financials and
 * waits for the masthead, the two sections its figures read, so no figure
 * shows a dash while it loads. The sector medians read Overview and
 * Valuation, and a median whose section has not loaded shows the dash, as
 * the data-model note says.
 */
export function heldBack<K extends CompanySectionKey>(
	lead: CompanyState<K>,
	others: readonly CompanyState<CompanySectionKey>[],
): CompanyState<K> {
	if (lead.status !== "loaded") return lead;
	if (others.some(({ status }) => status === "loading")) {
		return { status: "loading" };
	}
	for (const other of others) {
		if (other.status === "missing" || other.status === "failed") {
			return { status: "failed", error: other.error };
		}
	}
	return lead;
}

/** Returns the sections of a load, or `null` until it loads. */
export function loadedSections<K extends CompanySectionKey>(
	state: CompanyState<K>,
): Nullable<CompletedSections> {
	return state.status === "loaded" ? state.sections : null;
}

/** The two sides of each pair of bars in card 1.4, with the chart token of each. */
export const SIDES = [
	{ key: "assets", label: "Assets", fill: "bg-chart-2" },
	{ key: "liabilities", label: "Liabilities", fill: "bg-chart-3" },
] as const;

/** How one bar of card 1.4 draws. */
export interface PositionBar extends BarBox {
	readonly side: (typeof SIDES)[number];
	readonly figure: Figure;
	/** `null` when the figure is missing or its value is not a finite number. */
	readonly value: number | null;
	/** The name a screen reader speaks, such as `Short term assets: $4.2B`. */
	readonly text: string;
}

/**
 * Returns how the bars of card 1.4 draw: one list for each row of `rows`,
 * all on one scale that holds zero, and where the zero line sits. A negative
 * figure draws below the zero line, and a small one keeps a least height.
 */
export function positionBars(rows: readonly PositionRow[]): {
	plots: PositionBar[][];
	zero: number;
} {
	const bars = rows.map((row) =>
		SIDES.map((side) => {
			const figure = row[side.key];
			const value = figure?.value;
			const known =
				figure !== null && typeof value === "number" && Number.isFinite(value)
					? value
					: null;
			const shown =
				figure === null || known === null
					? MISSING
					: formatInUnit(known, figure.unit);
			const text = `${row.term} ${side.label.toLowerCase()}: ${shown}`;
			return { side, figure, value: known, text };
		}),
	);
	const { boxes, zero } = barBoxes(bars.flat().map(({ value }) => value));
	const plots = bars.map((plot, row) =>
		plot.map((bar, index) => ({
			...bar,
			...(boxes[row * SIDES.length + index] as BarBox),
		})),
	);
	return { plots, zero };
}
