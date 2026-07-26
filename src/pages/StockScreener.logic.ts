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
 * How many filter criteria are currently active — drives the count badge on the
 * Filters button. A criterion counts when its string is non-empty or its
 * boolean is true. Exception: `downLastMonth` requires a parseable number — a
 * non-numeric string is treated as inactive to mirror the NaN guard in
 * {@link filterStocks}.
 */
export function countActiveFilters(filters: FilterState): number {
	return [
		filters.search,
		filters.country,
		filters.sector,
		filters.peMin,
		filters.peMax,
		filters.priceToCashMax,
		filters.priceToFcfMax,
		filters.quickRatioMin,
		filters.currentRatioMin,
		filters.buybackYieldMin,
		filters.dividendYieldMin,
		filters.nearFiftyTwoWeekLow,
		// Count down-last-month only when it parses to a number, mirroring the
		// NaN guard in filterStocks so the badge can't show a phantom filter.
		filters.downLastMonth !== "" &&
			!Number.isNaN(parseFloat(filters.downLastMonth)),
	].filter(Boolean).length;
}

/**
 * Returns the stocks matching every active criterion in `filters`, preserving
 * input order. Empty criteria are ignored; numeric bounds exclude rows whose
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
	if (filters.peMin) {
		const min = parseFloat(filters.peMin);
		list = list.filter((s) => s.peRatio !== null && s.peRatio >= min);
	}
	if (filters.peMax) {
		const max = parseFloat(filters.peMax);
		list = list.filter((s) => s.peRatio !== null && s.peRatio <= max);
	}
	if (filters.priceToCashMax) {
		const max = parseFloat(filters.priceToCashMax);
		list = list.filter((s) => s.priceToCash !== null && s.priceToCash <= max);
	}
	if (filters.priceToFcfMax) {
		const max = parseFloat(filters.priceToFcfMax);
		list = list.filter((s) => s.priceToFcf !== null && s.priceToFcf <= max);
	}
	if (filters.quickRatioMin) {
		const min = parseFloat(filters.quickRatioMin);
		list = list.filter((s) => s.quickRatio !== null && s.quickRatio >= min);
	}
	if (filters.currentRatioMin) {
		const min = parseFloat(filters.currentRatioMin);
		list = list.filter((s) => s.currentRatio !== null && s.currentRatio >= min);
	}
	if (filters.buybackYieldMin) {
		const min = parseFloat(filters.buybackYieldMin);
		list = list.filter((s) => s.buybackYield !== null && s.buybackYield >= min);
	}
	if (filters.dividendYieldMin) {
		const min = parseFloat(filters.dividendYieldMin);
		list = list.filter(
			(s) => s.dividendYield !== null && s.dividendYield >= min,
		);
	}
	if (filters.nearFiftyTwoWeekLow) {
		list = list.filter(isNearFiftyTwoWeekLow);
	}
	if (filters.downLastMonth) {
		const threshold = parseFloat(filters.downLastMonth);
		if (!Number.isNaN(threshold)) {
			list = list.filter((s) => s.changePercent1M <= -threshold);
		}
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
