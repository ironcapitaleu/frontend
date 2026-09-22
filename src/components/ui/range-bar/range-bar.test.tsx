import { describe, expect, it } from "vitest";

import { rangeBarPosition } from ".";

describe("rangeBarPosition", () => {
	it("should return the share of the range when the value is inside it", () => {
		const expectedResult = 25;

		const result = rangeBarPosition(125, 100, 200);

		expect(result).toBe(expectedResult);
	});

	it("should clamp to the left end when the value is below the low", () => {
		const expectedResult = 0;

		const result = rangeBarPosition(80, 100, 200);

		expect(result).toBe(expectedResult);
	});

	it("should clamp to the right end when the value is above the high", () => {
		const expectedResult = 100;

		const result = rangeBarPosition(260, 100, 200);

		expect(result).toBe(expectedResult);
	});

	it("should return the middle when the range is empty", () => {
		const expectedResult = 50;

		const result = rangeBarPosition(10, 10, 10);

		expect(result).toBe(expectedResult);
	});
});
