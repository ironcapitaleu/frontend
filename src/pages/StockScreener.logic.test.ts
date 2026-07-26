import { describe, expect, it } from "vitest";

import {
	EMPTY_FILTERS,
	type FilterState,
	type Stock,
	countActiveFilters,
	filterStocks,
	isNearFiftyTwoWeekLow,
	sortStocks,
} from "./StockScreener.logic";

function makeStock(symbol: string, overrides: Partial<Stock> = {}): Stock {
	return {
		symbol,
		name: `${symbol} Inc.`,
		sector: "Technology",
		country: "US",
		price: 100,
		marketCap: 1_000_000_000,
		changePercent1M: 0,
		peRatio: 15,
		priceToCash: 10,
		priceToFcf: 12,
		quickRatio: 1,
		currentRatio: 1,
		buybackYield: 0,
		dividendYield: 0,
		weekLow52: 50,
		weekHigh52: 150,
		...overrides,
	};
}

function withFilters(overrides: Partial<FilterState>): FilterState {
	return { ...EMPTY_FILTERS, ...overrides };
}

describe("filterStocks", () => {
	it("should return every stock when no criteria are set", () => {
		const stocks = [makeStock("AAA"), makeStock("BBB")];

		const expectedResult = ["AAA", "BBB"];

		const result = filterStocks(stocks, EMPTY_FILTERS).map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it.each([
		{ query: "aaa", label: "the symbol", expected: ["AAA"] },
		{ query: "microsoft", label: "the name", expected: ["MSFT"] },
		{
			query: "APPLE",
			label: "the name case-insensitively",
			expected: ["AAPL"],
		},
	])(
		"should match a stock by $label when search is '$query'",
		({ query, expected }) => {
			const stocks = [
				makeStock("AAA", { name: "Alpha Corp." }),
				makeStock("AAPL", { name: "Apple Inc." }),
				makeStock("MSFT", { name: "Microsoft Corp." }),
			];

			const expectedResult = expected;

			const result = filterStocks(stocks, withFilters({ search: query })).map(
				(s) => s.symbol,
			);

			expect(result).toEqual(expectedResult);
		},
	);

	it("should keep only stocks in the selected country", () => {
		const stocks = [
			makeStock("US1", { country: "US" }),
			makeStock("DE1", { country: "DE" }),
		];

		const expectedResult = ["DE1"];

		const result = filterStocks(stocks, withFilters({ country: "DE" })).map(
			(s) => s.symbol,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep only stocks in the selected sector", () => {
		const stocks = [
			makeStock("TEC", { sector: "Technology" }),
			makeStock("FIN", { sector: "Finance" }),
		];

		const expectedResult = ["FIN"];

		const result = filterStocks(stocks, withFilters({ sector: "Finance" })).map(
			(s) => s.symbol,
		);

		expect(result).toEqual(expectedResult);
	});

	it.each([
		{
			label: "quickRatioMin",
			criterion: { quickRatioMin: "1.0" } as Partial<FilterState>,
			expected: ["A"],
		},
		{
			label: "currentRatioMin",
			criterion: { currentRatioMin: "1.5" } as Partial<FilterState>,
			expected: ["A"],
		},
		{
			label: "buybackYieldMin",
			criterion: { buybackYieldMin: "2" } as Partial<FilterState>,
			expected: ["A"],
		},
		{
			label: "dividendYieldMin",
			criterion: { dividendYieldMin: "1" } as Partial<FilterState>,
			expected: ["A"],
		},
		{
			label: "peMin",
			criterion: { peMin: "20" } as Partial<FilterState>,
			expected: ["B"],
		},
	])(
		"should keep only stocks meeting the lower bound when $label is set",
		({ criterion, expected }) => {
			const stocks = [
				makeStock("A", {
					peRatio: 10,
					quickRatio: 1.5,
					currentRatio: 2.0,
					buybackYield: 4,
					dividendYield: 3,
				}),
				makeStock("B", {
					peRatio: 30,
					quickRatio: 0.8,
					currentRatio: 1.0,
					buybackYield: 1,
					dividendYield: 0.5,
				}),
			];

			const expectedResult = expected;

			const result = filterStocks(stocks, withFilters(criterion)).map(
				(s) => s.symbol,
			);

			expect(result).toEqual(expectedResult);
		},
	);

	it.each([
		{
			label: "peMax",
			criterion: { peMax: "20" } as Partial<FilterState>,
			expected: ["A"],
		},
		{
			label: "priceToCashMax",
			criterion: { priceToCashMax: "10" } as Partial<FilterState>,
			expected: ["A"],
		},
		{
			label: "priceToFcfMax",
			criterion: { priceToFcfMax: "10" } as Partial<FilterState>,
			expected: ["A"],
		},
	])(
		"should keep only stocks meeting the upper bound when $label is set",
		({ criterion, expected }) => {
			const stocks = [
				makeStock("A", { peRatio: 10, priceToCash: 5, priceToFcf: 8 }),
				makeStock("B", { peRatio: 30, priceToCash: 25, priceToFcf: 40 }),
			];

			const expectedResult = expected;

			const result = filterStocks(stocks, withFilters(criterion)).map(
				(s) => s.symbol,
			);

			expect(result).toEqual(expectedResult);
		},
	);

	it("should exclude a stock whose metric is null when a numeric bound is set", () => {
		const stocks = [
			makeStock("HAS", { peRatio: 12 }),
			makeStock("NUL", { peRatio: null }),
		];

		const expectedResult = ["HAS"];

		const result = filterStocks(stocks, withFilters({ peMin: "5" })).map(
			(s) => s.symbol,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep only stocks trading near their 52-week low when the flag is set", () => {
		const stocks = [
			makeStock("LOW", { price: 55, weekLow52: 50 }),
			makeStock("HIGH", { price: 90, weekLow52: 50 }),
		];

		const expectedResult = ["LOW"];

		const result = filterStocks(
			stocks,
			withFilters({ nearFiftyTwoWeekLow: true }),
		).map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should keep only stocks down at least the threshold over the last month", () => {
		const stocks = [
			makeStock("DROP", { changePercent1M: -8 }),
			makeStock("DIP", { changePercent1M: -3 }),
			makeStock("RISE", { changePercent1M: 2 }),
		];

		const expectedResult = ["DROP"];

		const result = filterStocks(
			stocks,
			withFilters({ downLastMonth: "5" }),
		).map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should ignore the down-last-month filter when its value is not a number", () => {
		const stocks = [
			makeStock("DROP", { changePercent1M: -8 }),
			makeStock("RISE", { changePercent1M: 2 }),
		];

		const expectedResult = ["DROP", "RISE"];

		const result = filterStocks(
			stocks,
			withFilters({ downLastMonth: "abc" }),
		).map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should apply every active criterion together with AND semantics", () => {
		const stocks = [
			makeStock("KEEP", { country: "US", peRatio: 12 }),
			makeStock("WRONGPE", { country: "US", peRatio: 40 }),
			makeStock("WRONGCTY", { country: "DE", peRatio: 12 }),
		];

		const expectedResult = ["KEEP"];

		const result = filterStocks(
			stocks,
			withFilters({ country: "US", peMax: "20" }),
		).map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should not mutate the input array", () => {
		const stocks = [
			makeStock("US1", { country: "US" }),
			makeStock("DE1", { country: "DE" }),
		];

		const expectedResult = ["US1", "DE1"];

		filterStocks(stocks, withFilters({ country: "US" }));
		const result = stocks.map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});
});

describe("sortStocks", () => {
	it("should order by a numeric field ascending", () => {
		const stocks = [
			makeStock("MID", { peRatio: 15 }),
			makeStock("LOW", { peRatio: 5 }),
			makeStock("HIGH", { peRatio: 30 }),
		];

		const expectedResult = ["LOW", "MID", "HIGH"];

		const result = sortStocks(stocks, "peRatio", "asc").map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should order by a numeric field descending", () => {
		const stocks = [
			makeStock("MID", { peRatio: 15 }),
			makeStock("LOW", { peRatio: 5 }),
			makeStock("HIGH", { peRatio: 30 }),
		];

		const expectedResult = ["HIGH", "MID", "LOW"];

		const result = sortStocks(stocks, "peRatio", "desc").map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should order by a string field with locale ordering ascending", () => {
		const stocks = [
			makeStock("CCC", { name: "Charlie" }),
			makeStock("AAA", { name: "Alpha" }),
			makeStock("BBB", { name: "Bravo" }),
		];

		const expectedResult = ["Alpha", "Bravo", "Charlie"];

		const result = sortStocks(stocks, "name", "asc").map((s) => s.name);

		expect(result).toEqual(expectedResult);
	});

	it("should place null values last when sorting ascending", () => {
		const stocks = [
			makeStock("NUL", { peRatio: null }),
			makeStock("LOW", { peRatio: 5 }),
			makeStock("HIGH", { peRatio: 30 }),
		];

		const expectedResult = ["LOW", "HIGH", "NUL"];

		const result = sortStocks(stocks, "peRatio", "asc").map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should place null values last when sorting descending", () => {
		const stocks = [
			makeStock("NUL", { peRatio: null }),
			makeStock("LOW", { peRatio: 5 }),
			makeStock("HIGH", { peRatio: 30 }),
		];

		const expectedResult = ["HIGH", "LOW", "NUL"];

		const result = sortStocks(stocks, "peRatio", "desc").map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});

	it("should not mutate the input array", () => {
		const stocks = [
			makeStock("MID", { peRatio: 15 }),
			makeStock("LOW", { peRatio: 5 }),
		];

		const expectedResult = ["MID", "LOW"];

		sortStocks(stocks, "peRatio", "asc");
		const result = stocks.map((s) => s.symbol);

		expect(result).toEqual(expectedResult);
	});
});

describe("isNearFiftyTwoWeekLow", () => {
	it.each([
		{ price: 60, within: "at the 20% band edge", expected: true },
		{ price: 50, within: "at the low", expected: true },
		{ price: 61, within: "just above the band", expected: false },
	])(
		"should report $expected when the price is $within",
		({ price, expected }) => {
			const stock = makeStock("ANY", { price, weekLow52: 50 });

			const expectedResult = expected;

			const result = isNearFiftyTwoWeekLow(stock);

			expect(result).toBe(expectedResult);
		},
	);
});

describe("countActiveFilters", () => {
	it("should count no active filters for the empty state", () => {
		const expectedResult = 0;

		const result = countActiveFilters(EMPTY_FILTERS);

		expect(result).toBe(expectedResult);
	});

	it("should count each set string criterion and the boolean flag", () => {
		const filters = withFilters({
			search: "aapl",
			country: "US",
			nearFiftyTwoWeekLow: true,
		});

		const expectedResult = 3;

		const result = countActiveFilters(filters);

		expect(result).toBe(expectedResult);
	});

	it("should count a numeric down-last-month value as an active filter", () => {
		const filters = withFilters({ downLastMonth: "5" });

		const expectedResult = 1;

		const result = countActiveFilters(filters);

		expect(result).toBe(expectedResult);
	});

	it("should not count a non-numeric down-last-month value as an active filter", () => {
		const filters = withFilters({ downLastMonth: "abc" });

		const expectedResult = 0;

		const result = countActiveFilters(filters);

		expect(result).toBe(expectedResult);
	});
});
