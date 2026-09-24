import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
			`top: calc(${place(0).top}% - 2px); height: 2px;`,
			`top: ${b.top}%; height: ${b.height}%;`,
		];

		const result = barStyles();

		expect(result).toEqual(expectedResult);
	});

	it("should draw no segment for a negative or missing part and a 2 px mark for a zero when the chart is stacked", () => {
		render(<BarChart table={table} format={String} stacked />);

		const expectedResult = [
			"bottom: 0px; height: 176px;",
			"bottom: 176px; height: 2px;",
		];

		const result = barStyles();

		expect(result).toEqual(expectedResult);
	});
});
