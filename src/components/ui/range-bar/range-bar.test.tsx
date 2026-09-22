import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RangeBar, rangeBarPosition } from ".";

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

	it("should return null when the range is empty", () => {
		const expectedResult = null;

		const result = rangeBarPosition(10, 10, 10);

		expect(result).toBe(expectedResult);
	});

	it("should return null when the range is inverted", () => {
		const expectedResult = null;

		const result = rangeBarPosition(150, 200, 100);

		expect(result).toBe(expectedResult);
	});

	it("should return null when the value is missing", () => {
		const expectedResult = null;

		const result = rangeBarPosition(Number.NaN, 100, 200);

		expect(result).toBe(expectedResult);
	});

	it("should return null when the value is infinite", () => {
		const expectedResult = null;

		const result = rangeBarPosition(Number.POSITIVE_INFINITY, 100, 200);

		expect(result).toBe(expectedResult);
	});
});

describe("RangeBar", () => {
	it("should name the meter when aria-labelledby points at a heading", () => {
		render(
			<>
				<span id="range-heading">52-week range</span>
				<RangeBar
					aria-label="52-week range"
					aria-labelledby="range-heading"
					value={172.5}
					low={163.08}
					high={199.62}
				/>
			</>,
		);

		const expectedResult = "52-week range";

		const result = screen.getByRole("meter");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should read no data and draw no meter when the value is missing", () => {
		render(
			<RangeBar
				aria-label="52-week range"
				value={Number.NaN}
				low={163.08}
				high={199.62}
			/>,
		);

		const expectedResult = { meter: null, text: "52-week range: no data" };

		const result = {
			meter: screen.queryByRole("meter"),
			text: screen.getByText(/no data/).textContent,
		};

		expect(result).toEqual(expectedResult);
	});
});
