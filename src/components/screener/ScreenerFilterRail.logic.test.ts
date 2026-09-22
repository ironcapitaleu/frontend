import { describe, expect, it } from "vitest";

import {
	EMPTY_FILTERS,
	type FilterState,
} from "@/pages/public/StockScreener.logic";
import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import {
	RAIL_GROUPS,
	type RailMetric,
	applyMetricRange,
	distinctValues,
	hasActiveFilters,
	metricBounds,
	metricRange,
} from "./ScreenerFilterRail.logic";

function findMetric(label: string): RailMetric {
	const metric = RAIL_GROUPS.flatMap((group) => group.metrics).find(
		(candidate) => candidate.label === label,
	);
	if (!metric) throw new Error(`No rail metric named ${label}`);
	return metric;
}

function withFilters(overrides: Partial<FilterState>): FilterState {
	return { ...EMPTY_FILTERS, ...overrides };
}

describe("metricRange", () => {
	it("should rest both thumbs at the ends when no bound is set", () => {
		const expectedResult = [0, 40];

		const result = metricRange(findMetric("P/E"), EMPTY_FILTERS);

		expect(result).toEqual(expectedResult);
	});

	it("should read both bounds when a two-sided filter is set", () => {
		const filters = withFilters({ peMin: "5", peMax: "20" });

		const expectedResult = [5, 20];

		const result = metricRange(findMetric("P/E"), filters);

		expect(result).toEqual(expectedResult);
	});

	it("should clamp a bound to the track when it lies outside", () => {
		const filters = withFilters({ peMax: "90" });

		const expectedResult = [0, 40];

		const result = metricRange(findMetric("P/E"), filters);

		expect(result).toEqual(expectedResult);
	});

	it("should flip the sign when the filter stores a drop as a positive number", () => {
		const filters = withFilters({ downLastMonth: "3" });

		const expectedResult = [-15, -3];

		const result = metricRange(findMetric("1M change"), filters);

		expect(result).toEqual(expectedResult);
	});

	it("should ignore a bound when its value does not parse", () => {
		const filters = withFilters({ dividendYieldMin: "abc" });

		const expectedResult = [0, 8];

		const result = metricRange(findMetric("Dividend yield"), filters);

		expect(result).toEqual(expectedResult);
	});
});

describe("applyMetricRange", () => {
	it("should write both bounds when both thumbs moved", () => {
		const expectedResult = withFilters({ peMin: "5", peMax: "20.5" });

		const result = applyMetricRange(
			findMetric("P/E"),
			EMPTY_FILTERS,
			[5, 20.5],
		);

		expect(result).toEqual(expectedResult);
	});

	it("should clear a bound when its thumb returns to the end of the track", () => {
		const filters = withFilters({ peMin: "5", peMax: "20" });

		const expectedResult = withFilters({ peMax: "20" });

		const result = applyMetricRange(findMetric("P/E"), filters, [0, 20]);

		expect(result).toEqual(expectedResult);
	});

	it("should store a drop as a positive number when the 1M thumb moves below zero", () => {
		const expectedResult = withFilters({ downLastMonth: "4.5" });

		const result = applyMetricRange(
			findMetric("1M change"),
			EMPTY_FILTERS,
			[-15, -4.5],
		);

		expect(result).toEqual(expectedResult);
	});

	it("should round away floating-point noise when the step is fractional", () => {
		const expectedResult = withFilters({ quickRatioMin: "1.15" });

		const result = applyMetricRange(
			findMetric("Quick ratio"),
			EMPTY_FILTERS,
			[1.1500000000000001, 3],
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("metricBounds", () => {
	it("should list the thumbs of each metric in rail order", () => {
		const expectedResult = [
			"both",
			"upper",
			"upper",
			"lower",
			"lower",
			"lower",
			"lower",
			"upper",
		];

		const result = RAIL_GROUPS.flatMap((group) => group.metrics).map(
			metricBounds,
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("distinctValues", () => {
	it("should list each country once in alphabetical order", () => {
		const expectedResult = ["DE", "US"];

		const result = distinctValues(fakeStockScreenerResults, "country");

		expect(result).toEqual(expectedResult);
	});
});

describe("hasActiveFilters", () => {
	it("should return false when the filters are empty", () => {
		const expectedResult = false;

		const result = hasActiveFilters(EMPTY_FILTERS);

		expect(result).toBe(expectedResult);
	});

	it("should return true when one switch is on", () => {
		const expectedResult = true;

		const result = hasActiveFilters(withFilters({ nearFiftyTwoWeekLow: true }));

		expect(result).toBe(expectedResult);
	});
});
