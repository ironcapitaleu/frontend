import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { completeSections } from "@/lib/company/metrics";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { meridianOverview } from "@/lib/company/sample/overview";
import { figureGroupsOf } from "@/lib/company/sources";
import { SourcesIndex } from "./SourcesIndex";

/** The Overview figure groups of Meridian, with the sections Overview reads. */
const groups = figureGroupsOf(
	"overview",
	completeSections({
		masthead: null,
		overview: meridianOverview,
		financials: meridianFinancials,
		valuation: null,
		shareholderReturns: null,
		relationships: null,
		management: null,
		filings: null,
	}),
);

/**
 * The collapsed index "Where these numbers come from" at the foot of a tab.
 * It lists the filings behind Meridian's Overview tab, newest first, each
 * with its date, the figures it feeds and a link to the filing.
 */
const meta: Meta<typeof SourcesIndex> = {
	title: "Company/SourcesIndex",
	component: SourcesIndex,
	tags: ["autodocs"],
	args: { groups },
};

export default meta;
type Story = StoryObj<typeof SourcesIndex>;

/** Play test: the index starts collapsed. */
export const Collapsed: Story = {
	play: async ({ canvasElement }) => {
		const expectedResult = "false";

		const result = within(canvasElement).getByRole("button", {
			name: /Where these numbers come from/,
		});

		await expect(result).toHaveAttribute("aria-expanded", expectedResult);
	},
};

/** Play test: opening the index shows the filings, each with a link to SEC EDGAR. */
export const Open: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: /Where these numbers come from/ }),
		);

		const expectedResult = "Open the filing on SEC EDGAR";

		const result = within(canvas.getAllByRole("listitem")[0]).getByRole("link");

		await expect(result).toHaveTextContent(expectedResult);
	},
};
