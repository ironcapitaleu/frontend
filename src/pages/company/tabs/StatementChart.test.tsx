import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MISSING } from "@/components/screener/format";

import { type BarTable, barScale } from "./financialsTable";
import { BarChart } from "./StatementChart";

const points = (...values: (number | null)[]) =>
	values.map((value) =>
		value === null ? null : { id: "t", label: "T", value, unit: "usd" },
	) as BarTable["lines"][number]["points"];
const table: BarTable = {
	columns: ["FY25", "FY26"].map((key) => ({ key, label: key, short: key })),
	lines: [
		{ key: "a", label: "A", points: points(40, -10) },
		{ key: "b", label: "B", points: points(0, null) },
	],
};

/** The table above with a negative part that gives whole pixels when stacked. */
const stackedTable: BarTable = {
	...table,
	lines: [
		{ key: "a", label: "A", points: points(30, -7) },
		{ key: "b", label: "B", points: points(0, null) },
	],
};

/** Returns the inline style of every drawn bar, in chart order. */
function barStyles() {
	const plot = screen.getByRole("list", { name: "Fiscal years" });
	return within(plot)
		.getAllByRole("button")
		.map((bar) => bar.parentElement?.getAttribute("style"));
}

describe("BarChart", () => {
	it("should place each bar by barScale beside the others when the chart is not stacked", () => {
		render(<BarChart table={table} format={String} />);
		const { place } = barScale(table);
		const [a, b] = [place(40), place(-10)];

		const expectedResult = [
			`top: ${a.top}%; height: ${a.height}%;`,
			`top: max(0px, ${place(0).top}% - 2px); height: 2px;`,
			`top: ${b.top}%; height: ${b.height}%;`,
		];

		const result = barStyles();

		expect(result).toEqual(expectedResult);
	});

	it("should draw a negative part below the zero line, no segment for a missing part and a 2 px mark for a zero when the chart is stacked", () => {
		render(<BarChart table={stackedTable} format={String} stacked />);

		const expectedResult = [
			"bottom: 42px; height: 180px;",
			"bottom: 222px; height: 2px;",
			"bottom: 0px; height: 42px;",
		];

		const result = barStyles();

		expect(result).toEqual(expectedResult);
	});

	it("should start the part above a zero on top of its 2 px mark when the zero sits in the middle of a column", () => {
		const middle: BarTable = {
			columns: [{ key: "FY26", label: "FY26", short: "FY26" }],
			lines: ["a", "b", "c"].map((key, index) => ({
				key,
				label: key,
				points: points([10, 0, 10][index] ?? null),
			})),
		};
		render(<BarChart table={middle} format={String} stacked />);

		const expectedResult = [
			"bottom: 0px; height: 111px;",
			"bottom: 111px; height: 2px;",
			"bottom: 113px; height: 111px;",
		];

		const result = barStyles();

		expect(result).toEqual(expectedResult);
	});

	it("should raise the zero line above the foot of the plot by the deepest negative part when a stacked part is negative", () => {
		render(<BarChart table={stackedTable} format={String} stacked />);

		const expectedResult = "top: 81.25%;";

		const plot = screen.getByRole("list", { name: "Fiscal years" });
		const result = plot.nextElementSibling?.getAttribute("style");

		expect(result).toBe(expectedResult);
	});

	it("should show the dimmed dash in a stacked column that has no part to draw", () => {
		const empty: BarTable = {
			columns: [{ key: "FY26", label: "FY2026", short: "FY26" }],
			lines: [
				{ key: "a", label: "A", points: points(null) },
				{ key: "b", label: "B", points: points(null) },
			],
		};
		render(<BarChart table={empty} format={String} stacked />);
		const plot = screen.getByRole("list", { name: "Fiscal years" });

		const expectedResult = MISSING;

		const result = within(plot)
			.getByRole("listitem")
			.textContent?.replace("FY2026", "");

		expect(result).toBe(expectedResult);
	});

	it("should paint a thin part above a negative part on top of it when the negative part is a later line", () => {
		const table: BarTable = {
			columns: [{ key: "FY26", label: "FY2026", short: "FY26" }],
			lines: [
				{ key: "a", label: "A", points: points(0.1) },
				{ key: "b", label: "B", points: points(-8) },
			],
		};
		render(<BarChart table={table} format={String} stacked />);
		const plot = screen.getByRole("list", { name: "Fiscal years" });
		const [above, below] = within(plot)
			.getAllByRole("button")
			.map((bar) => Number(bar.parentElement?.parentElement?.style.zIndex));

		const expectedResult = true;

		const result = Number(above) > Number(below);

		expect(result).toBe(expectedResult);
	});
});
