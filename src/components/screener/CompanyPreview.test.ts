import { describe, expect, it } from "vitest";

import {
	EMPTY_FILTERS,
	describeActiveFilters,
} from "@/pages/public/StockScreener.logic";
import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { describeRangePosition, matchValue } from "./CompanyPreview";

const [alfa] = fakeStockScreenerResults;

describe("matchValue", () => {
	it("should pair each active filter with the stock's own value when several are set", () => {
		const reasons = describeActiveFilters({
			...EMPTY_FILTERS,
			country: "US",
			peMax: "25",
			dividendYieldMin: "0.5",
			downLastMonth: "2",
			nearFiftyTwoWeekLow: true,
		});

		const expectedResult = ["US", "20.0", "1.0%", "−5.0%", "Yes"];

		const result = reasons.map((reason) => matchValue(alfa, reason));

		expect(result).toEqual(expectedResult);
	});
});

describe("describeRangePosition", () => {
	it("should state the distance above the low when the price is above it", () => {
		const expectedResult = "Trading 11% above its 52-week low.";

		const result = describeRangePosition(alfa);

		expect(result).toBe(expectedResult);
	});

	it("should say the price is at the low when it is not above it", () => {
		const expectedResult = "Trading at its 52-week low.";

		const result = describeRangePosition({ ...alfa, price: 90 });

		expect(result).toBe(expectedResult);
	});
});
