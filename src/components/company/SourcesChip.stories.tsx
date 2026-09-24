import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { completeSections } from "@/lib/company/metrics";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { figureGroupsOf } from "@/lib/company/sources";
import { SourcesChip } from "./SourcesChip";

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
 * The "Sources" chip of a chart card. A click opens the filings behind the
 * whole chart, newest first, each with its filing date and a link to SEC
 * EDGAR. Here it lists the ten 10-K filings behind Meridian's income chart.
 */
const meta: Meta<typeof SourcesChip> = {
	title: "Company/SourcesChip",
	component: SourcesChip,
	tags: ["autodocs"],
	args: { claims },
};

export default meta;
type Story = StoryObj<typeof SourcesChip>;

/** Play test: opening the chip lists the chart's filings, newest first. */
export const FilingsListed: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole("button", { name: "Sources" }));
		const popup = await body.findByRole("dialog", {
			name: "Sources of the chart",
		});

		const expectedResult = [
			2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017,
		].map((year) => `10-K for FY${year}`);

		const result = within(popup)
			.getAllByRole("listitem")
			.map((item) => item.querySelector("p")?.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: with no filing behind the chart, the chip renders nothing, since
 * a chip that opens onto nothing only adds a control.
 */
export const NoFilings: Story = {
	args: { claims: [] },
	play: async ({ canvasElement }) => {
		const expectedResult = null;

		const result = within(canvasElement).queryByRole("button", {
			name: "Sources",
		});

		await expect(result).toBe(expectedResult);
	},
};
