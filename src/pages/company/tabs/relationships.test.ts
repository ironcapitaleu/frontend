import { describe, expect, it } from "vitest";

import { formatShares } from "./relationships";

describe("formatShares", () => {
	it("should write billions with two decimals and millions with one when the counts are that large", () => {
		const expectedResult = ["2.13B", "861.4M", "12,500"];

		const result = [2_130_000_000, 861_400_000, 12_500].map(formatShares);

		expect(result).toEqual(expectedResult);
	});

	it("should write billions when a count just under a billion rounds up to a thousand millions", () => {
		const expectedResult = "1.00B";

		const result = formatShares(999_999_999);

		expect(result).toBe(expectedResult);
	});
});
