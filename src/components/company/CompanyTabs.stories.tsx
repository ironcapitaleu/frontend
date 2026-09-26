import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, within } from "storybook/test";

import { CompanyTabs } from "./CompanyTabs";

/**
 * The tab strip of the company page. Each tab links to its own URL, and the
 * tab of the current URL carries the underline.
 */
const meta: Meta<typeof CompanyTabs> = {
	title: "Company/CompanyTabs",
	component: CompanyTabs,
	tags: ["autodocs"],
	args: { symbol: "MRDN", activeTab: "overview" },
	decorators: [
		(Story) => (
			<MemoryRouter>
				<div className="p-6">
					<Story />
				</div>
			</MemoryRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof CompanyTabs>;

/** Overview is the active tab at the desktop width. All seven tabs fit in one row. */
export const Desktop: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
};

/** A tab other than Overview is active. */
export const ReturnsActive: Story = {
	args: { activeTab: "shareholderReturns" },
};

/**
 * On a phone the row scrolls sideways. The strip scrolls the active tab, the
 * last one here, into view.
 */
export const Phone: Story = {
	args: { activeTab: "filings" },
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const strip = canvas.getByRole("navigation", { name: "Company sections" });
		const active = canvas.getByRole("link", { name: "Filings" });

		const expectedResult = { scrolls: true, activeInView: true };

		const stripBox = strip.getBoundingClientRect();
		const activeBox = active.getBoundingClientRect();
		const result = {
			scrolls: strip.scrollWidth > strip.clientWidth,
			activeInView:
				activeBox.left >= stripBox.left && activeBox.right <= stripBox.right,
		};

		await expect(result).toEqual(expectedResult);
	},
};
