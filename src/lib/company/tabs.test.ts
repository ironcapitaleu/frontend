import { describe, expect, it } from "vitest";

import { findTab } from "./tabs";

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
