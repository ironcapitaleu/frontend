import { describe, expect, it } from "vitest";

import type { FundHolding } from "../../../lib/company/types";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { formatShares, largestFundPositions } from "./relationships";

const [harlow, pinecrest] = fakeCompanyReport.relationships.funds;

describe("largestFundPositions", () => {
	it("should list the fund with the most shares first when the funds come smallest first", () => {
		const funds: FundHolding[] = [pinecrest, harlow];

		const expectedResult = [1, 0];

		const result = largestFundPositions(funds, 10);

		expect(result).toEqual(expectedResult);
	});

	it("should put a fund with no share count last when another fund has one", () => {
		const funds: FundHolding[] = [{ ...harlow, shares: null }, pinecrest];

		const expectedResult = [1, 0];

		const result = largestFundPositions(funds, 10);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the largest funds only when there are more funds than the count", () => {
		const funds: FundHolding[] = [pinecrest, harlow];

		const expectedResult = [1];

		const result = largestFundPositions(funds, 1);

		expect(result).toEqual(expectedResult);
	});
});

describe("formatShares", () => {
	it("should write billions with two decimals and millions with one when the counts are that large", () => {
		const expectedResult = ["2.13B", "861.4M", "12,500"];

		const result = [2_130_000_000, 861_400_000, 12_500].map(formatShares);

		expect(result).toEqual(expectedResult);
	});
});
