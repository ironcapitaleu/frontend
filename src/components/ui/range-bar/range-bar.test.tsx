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
				<span id="range-heading">Price range over 52 weeks</span>
				<RangeBar
					aria-label="52-week range"
					aria-labelledby="range-heading"
					value={172.5}
					low={163.08}
					high={199.62}
				/>
			</>,
		);

		const expectedResult = "Price range over 52 weeks";

		const result = screen.getByRole("meter");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should read no data and draw no meter or marker when the value is missing", () => {
		const { container } = render(
			<RangeBar
				aria-label="52-week range"
				value={Number.NaN}
				low={163.08}
				high={199.62}
			/>,
		);

		const expectedResult = {
			meter: null,
			marker: null,
			text: "52-week range: no data",
		};

		// Deviation from TESTING.md §2.2: the marker is purely visual, so no
		// accessible query reaches it.
		const result = {
			meter: screen.queryByRole("meter"),
			marker: container.querySelector('[data-slot="range-bar-marker"]'),
			text: screen.getByText(/no data/).textContent,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should print a dash for a bound when the bound is missing", () => {
		render(
			<RangeBar
				aria-label="52-week range"
				value={172.5}
				low={Number.NaN}
				high={199.62}
			/>,
		);

		const expectedResult = true;

		const result = screen.queryByText("—") !== null;

		expect(result).toBe(expectedResult);
	});
});
