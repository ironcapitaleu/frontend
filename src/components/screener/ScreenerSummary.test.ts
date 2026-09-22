import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { buildSummaryCells } from "./ScreenerSummary";

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

	it("should skip missing values when the P/E median is taken", () => {
		const expectedResult = { value: "16.0", universe: "16.0" };

		const cell = buildSummaryCells(
			fakeStockScreenerResults,
			fakeStockScreenerResults,
		)[0];
		const result = { value: cell.value, universe: cell.universe };

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
