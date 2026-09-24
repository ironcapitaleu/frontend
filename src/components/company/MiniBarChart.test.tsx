import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { meridianFinancials } from "@/lib/company/sample/financials";
import type { Claim, Series } from "@/lib/company/types";
import { barStyle, MiniBarChart, miniBars } from "./MiniBarChart";

const revenue = meridianFinancials.income.annual.lines.find(
	(line) => line.key === "revenue",
) as Series;

/** The revenue series with the given values for its last years. `null` is a missing point. */
function seriesOf(...values: (number | null)[]): Series {
	const periods = revenue.periods.slice(-values.length);
	const points = revenue.points.slice(-values.length);
	return {
		...revenue,
		periods,
		points: values.map((value, index) =>
			value === null ? null : { ...(points[index] as Claim), value },
		),
	};
}

const heights = (series: Series) =>
	miniBars(series).bars.map((bar) => bar.height);

describe("miniBars", () => {
	it("should grow every bar up from a zero line at the bottom when all values are positive", () => {
		const expectedResult = { zero: 100, tops: [50, 0] };

		const { bars, zero } = miniBars(seriesOf(1, 2));
		const result = { zero, tops: bars.map((bar) => bar.top) };

		expect(result).toEqual(expectedResult);
	});

	it("should draw the negative bar down from the zero line when one value is negative", () => {
		const expectedResult = { zero: 75, top: 75, height: 25 };

		const { bars, zero } = miniBars(seriesOf(3, -1));
		const result = { zero, top: bars[1]?.top, height: bars[1]?.height };

		expect(result).toEqual(expectedResult);
	});

	it("should give the missing year no height when a point is null", () => {
		const expectedResult = [100, 0, 50];

		const result = heights(seriesOf(2, null, 1));

		expect(result).toEqual(expectedResult);
	});

	it("should treat the value as missing when it is not finite", () => {
		const expectedResult = [null, null, 1];

		const result = miniBars(
			seriesOf(Number.NaN, Number.POSITIVE_INFINITY, 1),
		).bars.map((bar) => bar.value);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the zero line at the bottom and draw no bar when every value is zero", () => {
		const expectedResult = { zero: 100, heights: [0, 0] };

		const { bars, zero } = miniBars(seriesOf(0, 0));
		const result = { zero, heights: bars.map((bar) => bar.height) };

		expect(result).toEqual(expectedResult);
	});

	it("should draw one full bar when the series has a single year", () => {
		const expectedResult = [
			{ key: "0-FY2026", year: "FY2026", value: 5, top: 0, height: 100 },
		];

		const result = miniBars(seriesOf(5)).bars;

		expect(result).toEqual(expectedResult);
	});

	it("should draw no bar and keep the zero line at the bottom when every year is missing", () => {
		const expectedResult = { zero: 100, heights: [0, 0] };

		const { bars, zero } = miniBars(seriesOf(null, null));
		const result = { zero, heights: bars.map((bar) => bar.height) };

		expect(result).toEqual(expectedResult);
	});

	it("should draw a small known value at the least height when it is far below the largest", () => {
		const expectedResult = [100, 2];

		const result = heights(seriesOf(1000, 1));

		expect(result).toEqual(expectedResult);
	});

	it("should give each bar its own key when two periods share a fiscal year", () => {
		const expectedResult = 2;

		const quarterly = seriesOf(1, 2);
		const period = quarterly.periods[0] as Series["periods"][number];
		const { bars } = miniBars({ ...quarterly, periods: [period, period] });
		const result = new Set(bars.map((bar) => bar.key)).size;

		expect(result).toBe(expectedResult);
	});

	it("should keep only the last ten years when the series has more", () => {
		const expectedResult = ["FY2018", "FY2027"];

		const long: Series = {
			...revenue,
			periods: [
				...revenue.periods,
				{
					...(revenue.periods.at(-1) as Series["periods"][number]),
					fiscalYear: 2027,
				},
			],
			points: [...revenue.points, revenue.points.at(-1) ?? null],
		};
		const { bars } = miniBars(long);
		const result = [bars[0]?.year, bars.at(-1)?.year];

		expect(result).toEqual(expectedResult);
	});
});

describe("barStyle", () => {
	it("should draw a 2 px mark above the zero line when the bar has no height", () => {
		const expectedResult = { top: "max(0px, calc(75% - 2px))", height: "2px" };

		const result = barStyle({ top: 75, height: 0 });

		expect(result).toEqual(expectedResult);
	});

	it("should keep the 2 px mark inside the plot when the zero line is near its top edge", () => {
		const expectedResult = {
			top: "max(0px, calc(0.01% - 2px))",
			height: "2px",
		};

		const result = barStyle({ top: 0.01, height: 0 });

		expect(result).toEqual(expectedResult);
	});

	it("should draw the bar at its top and height in percent when the bar has a height", () => {
		const expectedResult = { top: "25%", height: "50%" };

		const result = barStyle({ top: 25, height: 50 });

		expect(result).toEqual(expectedResult);
	});
});

describe("MiniBarChart", () => {
	it("should list each year with its value and a dash for the missing year when one point is null", () => {
		render(
			<MiniBarChart series={seriesOf(-2, null, 3)} formatValue={String} />,
		);

		const expectedResult = ["FY2024: -2", "FY2025: —", "FY2026: 3"];

		const result = screen
			.getAllByRole("listitem")
			.map((item) => item.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should print a dash as the latest figure when the latest year is missing", () => {
		render(<MiniBarChart series={seriesOf(1, null)} formatValue={String} />);

		const expectedResult = `${revenue.label} —`;

		const result = screen.getByRole("figure");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should make each known year's bar a button named by its year and value when one point is null", () => {
		render(
			<MiniBarChart series={seriesOf(-2, null, 3)} formatValue={String} />,
		);

		const expectedResult = ["FY2024: -2", "FY2026: 3"];

		const result = within(screen.getByRole("list"))
			.getAllByRole("button")
			.map((button) => button.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should pin the source card of an older year when its bar is clicked", async () => {
		const user = userEvent.setup();
		const series = seriesOf(-2, null, 3);
		render(<MiniBarChart series={series} formatValue={String} />);

		const expectedResult = `Sources of ${series.points[0]?.label}`;

		await user.click(screen.getByRole("button", { name: "FY2024: -2" }));
		const result = await screen.findByRole("dialog");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should preview the source card of an older year when its bar takes focus from the keyboard", async () => {
		const user = userEvent.setup();
		const series = seriesOf(-2, null);
		render(<MiniBarChart series={series} formatValue={String} />);

		const expectedResult = `Sources of ${series.points[0]?.label}`;

		await user.tab();
		const result = await screen.findByRole("dialog");

		expect(result).toHaveAccessibleName(expectedResult);
	});
});
