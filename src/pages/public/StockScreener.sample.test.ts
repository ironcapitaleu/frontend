import { describe, expect, it } from "vitest";

import {
	EMPTY_FILTERS,
	filterStocks,
} from "@/components/screener/screener.logic";
import { distinctValues } from "@/components/screener/ScreenerFilterRail.logic";
import {
	completeSections,
	evaluateMetric,
	priceChangeOneMonth,
} from "@/lib/company/metrics";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { meridianMasthead } from "@/lib/company/sample/masthead";
import { meridianOverview } from "@/lib/company/sample/overview";
import type { MetricKey } from "@/lib/company/types";

import {
	MERIDIAN_STOCK,
	MissingSampleFigure,
	SAMPLE_STOCKS,
	UnmappedSampleCategory,
	companyStock,
	requiredFigure,
} from "./StockScreener.sample";

// The Meridian sections, built here as the company page builds them, so the
// agreement test does not read the module under test.
const sections = completeSections({
	masthead: meridianMasthead,
	overview: meridianOverview,
	financials: meridianFinancials,
	valuation: null,
	shareholderReturns: null,
	relationships: null,
	management: null,
	filings: null,
});

/** The value of a metric on the company page, or `null` when it has none. */
function pageMetric(key: MetricKey): number | null {
	const result = evaluateMetric(key, sections);
	return result.kind === "value" ? Number(result.claim.value) : null;
}

describe("MERIDIAN_STOCK", () => {
	it("should agree with the company page on every figure they share when the screener lists MRDN", () => {
		const expectedResult = {
			listed: true,
			symbol: meridianMasthead.ticker.value,
			name: meridianMasthead.name,
			price: Number(meridianMasthead.price?.value),
			weekLow52: Number(meridianMasthead.low52Weeks?.value),
			weekHigh52: Number(meridianMasthead.high52Weeks?.value),
			changePercent1M:
				Number(priceChangeOneMonth(meridianMasthead)?.value) * 100,
			marketCap: pageMetric("marketCap"),
			peRatio: pageMetric("priceToEarnings"),
			priceToFcf: pageMetric("priceToFreeCashFlow"),
			currentRatio: pageMetric("currentRatio"),
			buybackYield: (pageMetric("buybackYield") ?? Number.NaN) * 100,
			dividendYield: (pageMetric("dividendYield") ?? Number.NaN) * 100,
		};

		const result = {
			listed: SAMPLE_STOCKS.includes(MERIDIAN_STOCK),
			symbol: MERIDIAN_STOCK.symbol,
			name: MERIDIAN_STOCK.name,
			price: MERIDIAN_STOCK.price,
			weekLow52: MERIDIAN_STOCK.weekLow52,
			weekHigh52: MERIDIAN_STOCK.weekHigh52,
			changePercent1M: MERIDIAN_STOCK.changePercent1M,
			marketCap: MERIDIAN_STOCK.marketCap,
			peRatio: MERIDIAN_STOCK.peRatio,
			priceToFcf: MERIDIAN_STOCK.priceToFcf,
			currentRatio: MERIDIAN_STOCK.currentRatio,
			buybackYield: MERIDIAN_STOCK.buybackYield,
			dividendYield: MERIDIAN_STOCK.dividendYield,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show a dividend yield of about 0.01% when the sample dividends per share are one tenth of the mock-up", () => {
		// `DIVIDENDS_PER_SHARE` in the company sample is one tenth of the
		// mock-up on purpose. This pins the yield it gives, so a change to the
		// sample shows here.
		const expectedResult = "0.01";

		const result = MERIDIAN_STOCK.dividendYield?.toFixed(2);

		expect(result).toBe(expectedResult);
	});

	it("should list MRDN under Technology when the reader picks the Technology sector", () => {
		const expectedResult = true;

		const result = filterStocks(SAMPLE_STOCKS, {
			...EMPTY_FILTERS,
			sector: "Technology",
		}).includes(MERIDIAN_STOCK);

		expect(result).toBe(expectedResult);
	});

	it("should add no sector chip of its own when the screener lists MRDN", () => {
		const others = SAMPLE_STOCKS.filter((stock) => stock !== MERIDIAN_STOCK);

		const expectedResult = distinctValues(others, "sector");

		const result = distinctValues(SAMPLE_STOCKS, "sector");

		expect(result).toEqual(expectedResult);
	});
});

describe("companyStock", () => {
	it("should throw UnmappedSampleCategory when the screener has no code for the sector", () => {
		const masthead = { ...meridianMasthead, sector: "Shipbuilding" };

		const expectedResult = new UnmappedSampleCategory("sector", "Shipbuilding");

		const result = () => companyStock(masthead, sections);

		expect(result).toThrow(expectedResult);
	});

	it("should throw UnmappedSampleCategory when the screener has no code for the country", () => {
		const masthead = { ...meridianMasthead, country: "Atlantis" };

		const expectedResult = new UnmappedSampleCategory("country", "Atlantis");

		const result = () => companyStock(masthead, sections);

		expect(result).toThrow(expectedResult);
	});

	it("should throw MissingSampleFigure when the market cap does not resolve", () => {
		const withoutFinancials = completeSections({
			...sections,
			financials: null,
		});

		const expectedResult = new MissingSampleFigure("marketCap");

		const result = () => companyStock(meridianMasthead, withoutFinancials);

		expect(result).toThrow(expectedResult);
	});

	it("should throw MissingSampleFigure when the masthead has no price", () => {
		const masthead = { ...meridianMasthead, price: null };

		const expectedResult = new MissingSampleFigure("price");

		const result = () => companyStock(masthead, sections);

		expect(result).toThrow(expectedResult);
	});
});

describe("requiredFigure", () => {
	it("should throw MissingSampleFigure when the figure is null", () => {
		const expectedResult = new MissingSampleFigure("price");

		const result = () => requiredFigure("price", null);

		expect(result).toThrow(expectedResult);
	});

	it("should return the number of the claim when the figure has one", () => {
		const expectedResult = Number(meridianMasthead.price?.value);

		const result = requiredFigure("price", meridianMasthead.price);

		expect(result).toBe(expectedResult);
	});
});
