import { describe, expect, it } from "vitest";

import { MISSING } from "@/components/screener/format";
import { formatInput, formatInUnit } from "./format";

describe("formatInUnit", () => {
	it.each([
		[212_000_000_000, "$212.0B", "usd"],
		[-4_000_000_000, "−$4.0B", "usd"],
		[24_500_000_000, "24.5B", "shares"],
		[18.44, "18.4", "ratio"],
		[0.312, "31.2%", "percent"],
	] as const)(
		"should write %s as %s when the unit is %s",
		(value, expectedResult, unit) => {
			const result = formatInUnit(value, unit);

			expect(result).toBe(expectedResult);
		},
	);
});

describe("formatInput", () => {
	it("should write a price with cents when the unit is dollars per share", () => {
		const input = { value: 82.75, unit: "usdPerShare" } as const;

		const expectedResult = "$82.75";

		const result = formatInput(input);

		expect(result).toBe(expectedResult);
	});

	it("should write a true minus before the dollar sign when a loss per share is read", () => {
		const input = { value: -1.2, unit: "usdPerShare" } as const;

		const expectedResult = "−$1.20";

		const result = formatInput(input);

		expect(result).toBe(expectedResult);
	});

	it("should write dollars in billions when the unit is dollars", () => {
		const input = { value: 212_000_000_000, unit: "usd" } as const;

		const expectedResult = "$212.0B";

		const result = formatInput(input);

		expect(result).toBe(expectedResult);
	});

	it("should give the missing dash when the value is not a number", () => {
		const input = { value: "not reported", unit: "usd" } as const;

		const expectedResult = MISSING;

		const result = formatInput(input);

		expect(result).toBe(expectedResult);
	});
});
