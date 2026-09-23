import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RangeBar, rangeBarPosition } from ".";

describe("rangeBarPosition", () => {
	it("should return the share of the range when the value is inside it", () => {
		const expectedResult = 25;

		const result = rangeBarPosition(125, 100, 200)?.percent;

		expect(result).toBe(expectedResult);
	});

	it("should clamp to the left end when the value is below the low", () => {
		const expectedResult = 0;

		const result = rangeBarPosition(80, 100, 200)?.percent;

		expect(result).toBe(expectedResult);
	});

	it("should clamp to the right end when the value is above the high", () => {
		const expectedResult = 100;

		const result = rangeBarPosition(260, 100, 200)?.percent;

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

	it("should return null when the value is null", () => {
		const expectedResult = null;

		const result = rangeBarPosition(null, 100, 200);

		expect(result).toBe(expectedResult);
	});

	it("should place the value from the left end when the range crosses zero", () => {
		const expectedResult = { percent: 25, clamped: -2.5 };

		const position = rangeBarPosition(-2.5, -5, 5);
		const result = { percent: position?.percent, clamped: position?.clamped };

		expect(result).toEqual(expectedResult);
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
			dash: "—",
			text: "52-week range: no data",
		};

		// Deviation from TESTING.md §2.2: the marker and the dash are purely
		// visual, so no accessible query reaches them.
		const result = {
			meter: screen.queryByRole("meter"),
			marker: container.querySelector('[data-slot="range-bar-marker"]'),
			dash: container.querySelector('[data-slot="range-bar-missing"]')
				?.textContent,
			text: screen.getByText(/no data/).textContent,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should print a dash for the missing bound and keep the other when one bound is missing", () => {
		const { container } = render(
			<RangeBar
				aria-label="52-week range"
				value={172.5}
				low={null}
				high={199.62}
			/>,
		);

		const expectedResult = { low: "—", high: "199.62" };

		// Deviation from TESTING.md §2.2: the bounds row is hidden from
		// assistive technology, so no accessible query reaches it.
		const bounds = container.querySelector('[data-slot="range-bar-bounds"]');
		const result = {
			low: bounds?.firstElementChild?.textContent,
			high: bounds?.lastElementChild?.textContent,
		};

		expect(result).toEqual(expectedResult);
	});
});
