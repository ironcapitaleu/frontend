import { describe, expect, it } from "vitest";

import { meridianMasthead } from "@/lib/company/sample/masthead";

import { MERIDIAN_STOCK, SAMPLE_STOCKS } from "./StockScreener.sample";

describe("MERIDIAN_STOCK", () => {
	it("should agree with the company sample on the figures they share when the screener lists MRDN", () => {
		const expectedResult = {
			listed: true,
			symbol: "MRDN",
			name: meridianMasthead.name,
			sector: meridianMasthead.sector,
			country: "US",
			price: meridianMasthead.price?.value,
			weekLow52: meridianMasthead.low52Weeks?.value,
			weekHigh52: meridianMasthead.high52Weeks?.value,
			// The metrics the company page derives from the same sample.
			marketCap: "5159.7B",
			peRatio: "38.2",
			priceToFcf: "43.7",
			currentRatio: "4.40",
			buybackYield: "1.2",
			changePercent1M: "4.1",
		};

		const result = {
			listed: SAMPLE_STOCKS.includes(MERIDIAN_STOCK),
			symbol: MERIDIAN_STOCK.symbol,
			name: MERIDIAN_STOCK.name,
			sector: MERIDIAN_STOCK.sector,
			country: MERIDIAN_STOCK.country,
			price: MERIDIAN_STOCK.price,
			weekLow52: MERIDIAN_STOCK.weekLow52,
			weekHigh52: MERIDIAN_STOCK.weekHigh52,
			marketCap: `${(MERIDIAN_STOCK.marketCap / 1e9).toFixed(1)}B`,
			peRatio: MERIDIAN_STOCK.peRatio?.toFixed(1),
			priceToFcf: MERIDIAN_STOCK.priceToFcf?.toFixed(1),
			currentRatio: MERIDIAN_STOCK.currentRatio?.toFixed(2),
			buybackYield: MERIDIAN_STOCK.buybackYield?.toFixed(1),
			changePercent1M: MERIDIAN_STOCK.changePercent1M.toFixed(1),
		};

		expect(result).toEqual(expectedResult);
	});
});
