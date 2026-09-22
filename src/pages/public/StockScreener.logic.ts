// Pure filtering and sorting logic for the stock screener, extracted from the
// component so it tests cleanly with a single `toEqual`. The component stays a
// thin shell that wires state to these functions.

/** A single screened security, in the shape the screener table renders. */
export interface Stock {
	readonly symbol: string;
	readonly name: string;
	readonly sector: string;
	readonly country: string;
	readonly price: number;
	readonly marketCap: number;
	readonly changePercent1M: number;
	readonly peRatio: number | null;
	readonly priceToCash: number | null;
	readonly priceToFcf: number | null;
	readonly quickRatio: number | null;
	readonly currentRatio: number | null;
	readonly buybackYield: number | null;
	readonly dividendYield: number | null;
	readonly weekLow52: number;
	readonly weekHigh52: number;
}

/**
 * The raw filter inputs, as they come off the form controls — numeric bounds are
 * kept as the strings the inputs produce and parsed at filter time, so an empty
 * string means "no bound".
 */
export interface FilterState {
	search: string;
	country: string;
	sector: string;
	peMin: string;
	peMax: string;
	priceToCashMax: string;
	priceToFcfMax: string;
	quickRatioMin: string;
	currentRatioMin: string;
	buybackYieldMin: string;
	dividendYieldMin: string;
	nearFiftyTwoWeekLow: boolean;
	downLastMonth: string;
}

/** The direction a sortable column is ordered in. */
export type SortDirection = "asc" | "desc";

/** Which column the table is sorted by, and in which direction. */
export interface SortConfig {
	field: keyof Stock;
	direction: SortDirection;
}

/** A named, ready-made screen the reader applies in one click. */
export interface StrategyPreset {
	readonly id: string;
	readonly label: string;
	/** Read-only, because every page shares this object. Apply it with {@link applyPreset}. */
	readonly filters: Readonly<FilterState>;
}

/** One active filter criterion, worded for a chip or a list. */
export interface FilterDescription {
	readonly field: keyof FilterState;
	readonly label: string;
	/** The bound as the reader reads it, for example `≤ 20` or `≥ 2%`. Empty for a switch. */
	readonly value: string;
}

/** The `FilterState` fields that hold free text or a numeric bound as a string. */
type StringFilterField = {
	[K in keyof FilterState]: FilterState[K] extends string ? K : never;
}[keyof FilterState];

/** A filter state with every criterion cleared — the screener's default. */
export const EMPTY_FILTERS: FilterState = {
	search: "",
	country: "",
	sector: "",
	peMin: "",
	peMax: "",
	priceToCashMax: "",
	priceToFcfMax: "",
	quickRatioMin: "",
	currentRatioMin: "",
	buybackYieldMin: "",
	dividendYieldMin: "",
	nearFiftyTwoWeekLow: false,
	downLastMonth: "",
};

/**
 * Whether a stock trades within 20% of its 52-week low — the "Near Low" signal
 * shown as a badge and offered as a filter.
 */
export function isNearFiftyTwoWeekLow(stock: Stock): boolean {
	return stock.price <= stock.weekLow52 * 1.2;
}

/**
 * Whether a numeric filter string is set to a value that actually filters —
 * non-empty and parseable as a number. A non-numeric string counts as inactive,
 * mirroring the NaN guard in {@link filterStocks} so the badge can't show a
 * phantom filter.
 */
export function isActiveNumericFilter(value: string): boolean {
	return value !== "" && !Number.isNaN(parseFloat(value));
}

/**
 * How many filter criteria are currently active — drives the count badge on the
 * Filters button. A text criterion (`search`, `country`, `sector`) counts when
 * its string is non-empty, and `nearFiftyTwoWeekLow` counts when true. A numeric
 * criterion counts only when its string parses to a number — a non-numeric value
 * is treated as inactive (see {@link isActiveNumericFilter}), so the badge never
 * counts a filter that {@link filterStocks} would ignore.
 */
export function countActiveFilters(filters: FilterState): number {
	return [
		filters.search,
		filters.country,
		filters.sector,
		filters.nearFiftyTwoWeekLow,
		isActiveNumericFilter(filters.peMin),
		isActiveNumericFilter(filters.peMax),
		isActiveNumericFilter(filters.priceToCashMax),
		isActiveNumericFilter(filters.priceToFcfMax),
		isActiveNumericFilter(filters.quickRatioMin),
		isActiveNumericFilter(filters.currentRatioMin),
		isActiveNumericFilter(filters.buybackYieldMin),
		isActiveNumericFilter(filters.dividendYieldMin),
		isActiveNumericFilter(filters.downLastMonth),
	].filter(Boolean).length;
}

/**
 * Returns the stocks matching every active criterion in `filters`, preserving
 * input order. Empty criteria are ignored, and a numeric criterion whose string
 * does not parse to a number is ignored too (see {@link isActiveNumericFilter}),
 * so a stray value can't empty the table; numeric bounds exclude rows whose
 * value is `null` (the metric is unavailable).
 *
 * @param stocks the universe to filter — not mutated
 * @param filters the active filter criteria
 */
export function filterStocks(
	stocks: readonly Stock[],
	filters: FilterState,
): Stock[] {
	let list = [...stocks];

	if (filters.search) {
		const q = filters.search.toLowerCase();
		list = list.filter(
			(s) =>
				s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
		);
	}
	if (filters.country) {
		list = list.filter((s) => s.country === filters.country);
	}
	if (filters.sector) {
		list = list.filter((s) => s.sector === filters.sector);
	}
	if (isActiveNumericFilter(filters.peMin)) {
		const min = parseFloat(filters.peMin);
		list = list.filter((s) => s.peRatio !== null && s.peRatio >= min);
	}
	if (isActiveNumericFilter(filters.peMax)) {
		const max = parseFloat(filters.peMax);
		list = list.filter((s) => s.peRatio !== null && s.peRatio <= max);
	}
	if (isActiveNumericFilter(filters.priceToCashMax)) {
		const max = parseFloat(filters.priceToCashMax);
		list = list.filter((s) => s.priceToCash !== null && s.priceToCash <= max);
	}
	if (isActiveNumericFilter(filters.priceToFcfMax)) {
		const max = parseFloat(filters.priceToFcfMax);
		list = list.filter((s) => s.priceToFcf !== null && s.priceToFcf <= max);
	}
	if (isActiveNumericFilter(filters.quickRatioMin)) {
		const min = parseFloat(filters.quickRatioMin);
		list = list.filter((s) => s.quickRatio !== null && s.quickRatio >= min);
	}
	if (isActiveNumericFilter(filters.currentRatioMin)) {
		const min = parseFloat(filters.currentRatioMin);
		list = list.filter((s) => s.currentRatio !== null && s.currentRatio >= min);
	}
	if (isActiveNumericFilter(filters.buybackYieldMin)) {
		const min = parseFloat(filters.buybackYieldMin);
		list = list.filter((s) => s.buybackYield !== null && s.buybackYield >= min);
	}
	if (isActiveNumericFilter(filters.dividendYieldMin)) {
		const min = parseFloat(filters.dividendYieldMin);
		list = list.filter(
			(s) => s.dividendYield !== null && s.dividendYield >= min,
		);
	}
	if (filters.nearFiftyTwoWeekLow) {
		list = list.filter(isNearFiftyTwoWeekLow);
	}
	if (isActiveNumericFilter(filters.downLastMonth)) {
		const threshold = parseFloat(filters.downLastMonth);
		list = list.filter((s) => s.changePercent1M <= -threshold);
	}

	return list;
}

/**
 * Returns the stocks ordered by `field` in `direction`. Strings compare with
 * locale ordering, numbers numerically; rows whose value is `null` always sort
 * last, regardless of direction. Stable with respect to the input, which is not
 * mutated.
 *
 * @param stocks the rows to order — not mutated
 * @param field the column to sort by
 * @param direction ascending or descending
 */
export function sortStocks(
	stocks: readonly Stock[],
	field: keyof Stock,
	direction: SortDirection,
): Stock[] {
	return [...stocks].sort((a, b) => {
		const av = a[field];
		const bv = b[field];
		if (av === null) return 1;
		if (bv === null) return -1;
		if (typeof av === "string" && typeof bv === "string") {
			return direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
		}
		return direction === "asc"
			? (av as number) - (bv as number)
			: (bv as number) - (av as number);
	});
}

/**
 * The strategies offered above the results. Each one is a plain
 * {@link FilterState}, so applying a preset is the same as setting its filters
 * by hand, and the reader can refine it afterwards. The list is fixed in code
 * until strategies become user data.
 */
export const STRATEGY_PRESETS: readonly StrategyPreset[] = [
	{
		id: "deep-value",
		label: "Deep value",
		filters: { ...EMPTY_FILTERS, peMax: "12", priceToFcfMax: "12" },
	},
	{
		id: "fair-price-income",
		label: "Income at a fair price",
		filters: { ...EMPTY_FILTERS, peMax: "20", dividendYieldMin: "2" },
	},
	{
		id: "cash-rich",
		label: "Cash-rich",
		filters: { ...EMPTY_FILTERS, quickRatioMin: "1", currentRatioMin: "1.5" },
	},
	{
		id: "beaten-down",
		label: "Beaten down",
		filters: {
			...EMPTY_FILTERS,
			nearFiftyTwoWeekLow: true,
			downLastMonth: "3",
		},
	},
];

/**
 * A fresh copy of the preset's filters, safe to hand to React state. The
 * preset's own object is shared by every page, so it is never set directly.
 */
export function applyPreset(preset: StrategyPreset): FilterState {
	return { ...preset.filters };
}

/**
 * The preset whose filters equal `filters` exactly, or `null` when the reader
 * has changed the screen away from every preset. The page uses it to mark the
 * active preset button.
 */
export function findActivePreset(filters: FilterState): StrategyPreset | null {
	return (
		STRATEGY_PRESETS.find((preset) =>
			(Object.keys(EMPTY_FILTERS) as (keyof FilterState)[]).every(
				(field) => preset.filters[field] === filters[field],
			),
		) ?? null
	);
}

/**
 * The median of the finite numbers in `values`, ignoring `null` and `NaN`
 * entries. Returns `null` when no number is left, so a caller renders a dash
 * instead of a misleading zero.
 */
export function median(values: readonly (number | null)[]): number | null {
	const sorted = values
		.filter(
			(value): value is number => value !== null && Number.isFinite(value),
		)
		.sort((a, b) => a - b);
	if (sorted.length === 0) return null;
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Describes each active criterion in `filters`, in the order of the new filter
 * rail (`ScreenerFilterRail`): the universe, valuation, balance sheet,
 * shareholder yield, momentum, then the signals. The filter chips and the
 * "Why it matched" list render these entries. A numeric criterion counts only
 * when it parses (see {@link isActiveNumericFilter}), the same rule
 * {@link filterStocks} and {@link countActiveFilters} apply.
 */
export function describeActiveFilters(
	filters: FilterState,
): FilterDescription[] {
	const descriptions: FilterDescription[] = [];
	const addText = (field: StringFilterField, label: string) => {
		if (filters[field] !== "") {
			descriptions.push({ field, label, value: filters[field] });
		}
	};
	const addBound = (
		field: StringFilterField,
		label: string,
		format: (bound: number) => string,
	) => {
		if (isActiveNumericFilter(filters[field])) {
			descriptions.push({
				field,
				label,
				value: format(parseFloat(filters[field])),
			});
		}
	};

	addText("search", "Search");
	addText("country", "Country");
	addText("sector", "Sector");
	addBound("peMin", "P/E", (bound) => `≥ ${bound}`);
	addBound("peMax", "P/E", (bound) => `≤ ${bound}`);
	addBound("priceToFcfMax", "P/FCF", (bound) => `≤ ${bound}`);
	addBound("priceToCashMax", "P/Cash", (bound) => `≤ ${bound}`);
	addBound("quickRatioMin", "Quick ratio", (bound) => `≥ ${bound}`);
	addBound("currentRatioMin", "Current ratio", (bound) => `≥ ${bound}`);
	addBound("dividendYieldMin", "Dividend yield", (bound) => `≥ ${bound}%`);
	addBound("buybackYieldMin", "Buyback yield", (bound) => `≥ ${bound}%`);
	// `downLastMonth` stores "down at least N%" as N, so the bound on the 1M
	// change is −N. Sign the result once, so a negative N reads "≤ +3%".
	addBound(
		"downLastMonth",
		"1M change",
		(bound) => `≤ ${formatSigned(-bound)}%`,
	);
	if (filters.nearFiftyTwoWeekLow) {
		descriptions.push({
			field: "nearFiftyTwoWeekLow",
			label: "Near 52-week low",
			value: "",
		});
	}

	return descriptions;
}

/** A number with an explicit sign and a true minus: `+3`, `−3`, or `0`. */
function formatSigned(value: number): string {
	if (value > 0) return `+${value}`;
	if (value < 0) return `−${Math.abs(value)}`;
	return "0";
}
