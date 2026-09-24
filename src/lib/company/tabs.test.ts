import { describe, expect, it } from "vitest";

import { COMPANY_TABS, findTab } from "./tabs";

describe("findTab", () => {
	it("should return Overview when the URL has no tab segment", () => {
		const expectedResult = "overview";

		const result = findTab(undefined)?.key;

		expect(result).toBe(expectedResult);
	});

	it("should return the Shareholder returns tab when the segment is returns", () => {
		const expectedResult = "shareholderReturns";

		const result = findTab("returns")?.key;

		expect(result).toBe(expectedResult);
	});

	it("should return null when no tab has the segment", () => {
		const expectedResult = null;

		const result = findTab("news");

		expect(result).toBe(expectedResult);
	});

	it("should return Overview when the segment is overview", () => {
		const expectedResult = "overview";

		const result = findTab("overview")?.key;

		expect(result).toBe(expectedResult);
	});

	it("should return the Financials tab when the segment has capitals", () => {
		const expectedResult = "financials";

		const result = findTab("Financials")?.key;

		expect(result).toBe(expectedResult);
	});
});

describe("COMPANY_TABS", () => {
	it("should list the seven tabs with their segments and keys when compared with the URL table of DESIGN.md section 8", () => {
		const expectedResult = [
			{ segment: null, key: "overview" },
			{ segment: "financials", key: "financials" },
			{ segment: "valuation", key: "valuation" },
			{ segment: "returns", key: "shareholderReturns" },
			{ segment: "relationships", key: "relationships" },
			{ segment: "management", key: "management" },
			{ segment: "filings", key: "filings" },
		];

		const result = COMPANY_TABS.map((tab) => ({
			segment: tab.segment,
			key: findTab(tab.segment ?? undefined)?.key,
		}));

		expect(result).toEqual(expectedResult);
	});
});
