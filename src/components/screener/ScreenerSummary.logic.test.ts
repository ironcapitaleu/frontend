import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { buildSummaryCells } from "./ScreenerSummary.logic";

describe("buildSummaryCells", () => {
	it("should print dashes and a neutral tone when the result set is empty", () => {
		const expectedResult = [
			{ value: "—", tone: "neutral" },
			{ value: "—", tone: "neutral" },
			{ value: "—", tone: "neutral" },
			{ value: "—", tone: "neutral" },
		];

		const result = buildSummaryCells([], fakeStockScreenerResults).map(
			({ value, tone }) => ({ value, tone }),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read each cell from its own metric and skip missing values when the whole universe matches", () => {
		const expectedResult = [
			{ label: "Median P/E", value: "16.0", universe: "16.0" },
			{ label: "Median P/FCF", value: "13.0", universe: "13.0" },
			{ label: "Median dividend", value: "2.0%", universe: "2.0%" },
			{ label: "Median 1M", value: "−1.0%", universe: "−1.0%" },
		];

		const result = buildSummaryCells(
			fakeStockScreenerResults,
			fakeStockScreenerResults,
		).map(({ label, value, universe }) => ({ label, value, universe }));

		expect(result).toEqual(expectedResult);
	});

	it("should tone the 1M cell as a loss when the median change is negative", () => {
		const matched = fakeStockScreenerResults.filter(
			(stock) => stock.changePercent1M < 0,
		);

		const expectedResult = "negative";

		const result = buildSummaryCells(matched, fakeStockScreenerResults)[3].tone;

		expect(result).toBe(expectedResult);
	});
});
