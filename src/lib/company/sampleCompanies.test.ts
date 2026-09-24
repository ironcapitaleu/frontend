import { describe, expect, it } from "vitest";

import { hasCompanyPage } from "./sampleCompanies";

describe("hasCompanyPage", () => {
	it("should name only the sample company when asked about several symbols", () => {
		const expectedResult = [true, true, false, false];

		const result = ["MRDN", "mrdn", "AAPL", "not a ticker"].map(hasCompanyPage);

		expect(result).toEqual(expectedResult);
	});
});
