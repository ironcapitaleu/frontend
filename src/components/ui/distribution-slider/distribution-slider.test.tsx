import { describe, expect, it } from "vitest";

import { binValues, describeRange, selectBins } from ".";

const oneDecimal = (value: number) => value.toFixed(1);

describe("binValues", () => {
	it("should count each value into its equal-width bin when all values are inside the range", () => {
		const expectedResult = [2, 1, 0, 1];

		const result = binValues([1, 9, 12, 35], 0, 40, 4);

		expect(result).toEqual(expectedResult);
	});

	it("should skip null entries when some values are missing", () => {
		const expectedResult = [1, 0];

		const result = binValues([null, 3, null], 0, 10, 2);

		expect(result).toEqual(expectedResult);
	});

	it("should put outliers into the edge bins when values fall outside the range", () => {
		const expectedResult = [1, 0, 2];

		const result = binValues([-5, 30, 99], 0, 30, 3);

		expect(result).toEqual(expectedResult);
	});

	it("should return empty bins when the list is empty", () => {
		const expectedResult = [0, 0, 0];

		const result = binValues([], 0, 10, 3);

		expect(result).toEqual(expectedResult);
	});

	it("should return no bins when the count is negative", () => {
		const expectedResult: number[] = [];

		const result = binValues([1, 2], 0, 10, -1);

		expect(result).toEqual(expectedResult);
	});

	it("should return no bins when the count is fractional", () => {
		const expectedResult: number[] = [];

		const result = binValues([1, 2], 0, 10, 2.5);

		expect(result).toEqual(expectedResult);
	});

	it("should return no bins when the count is zero", () => {
		const expectedResult: number[] = [];

		const result = binValues([1, 2], 0, 10, 0);

		expect(result).toEqual(expectedResult);
	});

	it("should skip NaN and infinite entries when a metric is not a number", () => {
		const expectedResult = [1, 0];

		const result = binValues(
			[Number.NaN, 3, Number.POSITIVE_INFINITY],
			0,
			10,
			2,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should return empty bins when the range is empty", () => {
		const expectedResult = [0, 0];

		const result = binValues([5, 5], 5, 5, 2);

		expect(result).toEqual(expectedResult);
	});
});

describe("selectBins", () => {
	it("should mark only the bins inside the range when the upper thumb has moved", () => {
		const expectedResult = [true, true, false, false];

		const result = selectBins(4, [0, 20], 0, 40);

		expect(result).toEqual(expectedResult);
	});

	it("should leave a bin unmarked when the thumb stops inside it", () => {
		const expectedResult = [true, false, false, false];

		const result = selectBins(4, [0, 19], 0, 40);

		expect(result).toEqual(expectedResult);
	});
});

describe("describeRange", () => {
	it("should read Any when both thumbs rest at the ends", () => {
		const expectedResult = "Any";

		const result = describeRange([0, 40], 0, 40, oneDecimal);

		expect(result).toBe(expectedResult);
	});

	it("should state an upper bound when only the upper thumb moved", () => {
		const expectedResult = "≤ 20.0";

		const result = describeRange([0, 20], 0, 40, oneDecimal);

		expect(result).toBe(expectedResult);
	});

	it("should state a lower bound when only the lower thumb moved", () => {
		const expectedResult = "≥ 2.0";

		const result = describeRange([2, 8], 0, 8, oneDecimal);

		expect(result).toBe(expectedResult);
	});

	it("should state both bounds when both thumbs moved", () => {
		const expectedResult = "5.0 – 15.0";

		const result = describeRange([5, 15], 0, 40, oneDecimal);

		expect(result).toBe(expectedResult);
	});
});
