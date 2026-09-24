import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { completeSections } from "@/lib/company/metrics";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { figureGroupsOf } from "@/lib/company/sources";
import { ChartActions } from "./ChartActions";

/** The claims of Meridian's income statement chart, Financials card 2.1. */
const claims =
	figureGroupsOf(
		"financials",
		completeSections({
			masthead: null,
			overview: null,
			financials: meridianFinancials,
			valuation: null,
			shareholderReturns: null,
			relationships: null,
			management: null,
			filings: null,
		}),
	).find(({ ref }) => ref.block === "incomeChart")?.claims ?? [];

/**
 * The "Data" button and the "Sources" chip of a chart card. The button swaps
 * the chart for a table and back. Here it holds its own state, and the chip
 * lists the filings behind Meridian's income chart.
 */
const meta: Meta<typeof ChartActions> = {
	title: "Company/ChartActions",
	component: ChartActions,
	tags: ["autodocs"],
	args: { claims },
	render: function Render(args) {
		const [data, setData] = useState(false);
		return (
			<div className="flex gap-2">
				<ChartActions {...args} data={data} onData={setData} />
			</div>
		);
	},
};

export default meta;
type Story = StoryObj<typeof ChartActions>;

/** Play test: a click on "Data" presses the button, so the card shows its table. */
export const DataPressed: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole("button", { name: "Data" }));

		const expectedResult = "true";

		const result = canvas.getByRole("button", { name: "Data" });

		await expect(result).toHaveAttribute("aria-pressed", expectedResult);
	},
};
