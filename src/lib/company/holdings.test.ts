import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import {
	largestFundPositions,
	LISTED_FUNDS,
	listedFundPositions,
} from "./holdings";
import type { FundHolding } from "./types";

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

describe("listedFundPositions", () => {
	it("should list LISTED_FUNDS funds when there are more funds than that", () => {
		const funds: FundHolding[] = Array.from(
			{ length: LISTED_FUNDS + 3 },
			() => harlow,
		);

		const expectedResult = LISTED_FUNDS;

		const result = listedFundPositions(funds).length;

		expect(result).toBe(expectedResult);
	});

	it("should list no fund when no fund reports a share count", () => {
		const funds: FundHolding[] = [
			{ ...harlow, shares: null },
			{ ...pinecrest, shares: null },
		];

		const expectedResult: number[] = [];

		const result = listedFundPositions(funds);

		expect(result).toEqual(expectedResult);
	});
});
