import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { EMPTY_FILTERS, STRATEGY_PRESETS } from "./screener.logic";
import { MERIDIAN_STOCK } from "@/pages/public/StockScreener.sample";
import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { CompanyPreview } from "./CompanyPreview";

const beta = fakeStockScreenerResults[1];

/**
 * The company preview opens as a right `Sheet` when the reader selects a
 * result. The company name is the sheet's serif title. The "Why it matched"
 * list pairs each active filter with the company's own value, and the key
 * figures sit in a two-column grid. The footer links to the company page. A
 * company without a page shows the button disabled, with "Company page coming
 * soon" below it.
 *
 * Each story renders the sheet open. A router backs the footer link.
 */
const meta: Meta<typeof CompanyPreview> = {
	title: "Screener/CompanyPreview",
	component: CompanyPreview,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		// Every story mounts the sheet open, so the docs page gives each one its
		// own frame. Inline, the panels stack and lock the page scroll.
		docs: { story: { inline: false, iframeHeight: 600 } },
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<div className="min-h-screen">
					<Story />
				</div>
			</MemoryRouter>
		),
	],
	args: {
		stock: beta,
		filters: STRATEGY_PRESETS[1].filters,
		hasCompanyPage: true,
		open: true,
		onOpenChange: fn(),
	},
	argTypes: {
		stock: { control: { disable: true } },
		filters: { control: { disable: true } },
		onOpenChange: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** BETA under the "Income at a fair price" preset. */
export const Open: Story = {};

/**
 * MRDN, the sample company with a page. The footer link opens
 * `/companies/MRDN`.
 */
export const WithCompanyPage: Story = {
	args: { stock: MERIDIAN_STOCK, filters: EMPTY_FILTERS },
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);

		const expectedResult = "/companies/MRDN";

		const link = await page.findByRole("link", { name: "Open company page" });
		const result = link.getAttribute("href");

		await expect(result).toBe(expectedResult);
	},
};

/**
 * A company without a page. The button is disabled and the note says the page
 * is coming, so the preview never leads to the missing state.
 */
export const WithoutCompanyPage: Story = {
	args: { hasCompanyPage: false },
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);

		const expectedResult = { link: null, disabled: true };

		const button = await page.findByRole("button", {
			name: "Open company page",
		});
		const result = {
			link: page.queryByRole("link", { name: "Open company page" }),
			disabled: button.hasAttribute("disabled"),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** No filter is active, so the list says every company matches. */
export const WithoutFilters: Story = {
	args: { filters: EMPTY_FILTERS },
};

/** GAMMA, with most figures missing. Each reads as a dimmed dash. */
export const WithMissingFigures: Story = {
	args: { stock: fakeStockScreenerResults[2], filters: EMPTY_FILTERS },
};

/** A long company name wraps before the close button instead of running beneath it. */
export const LongName: Story = {
	args: {
		stock: { ...beta, name: "Beta Industries Holdings and Energy Group" },
	},
};

/** At a phone width the sheet fills the screen. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};

/**
 * Focus moves into the open sheet, and Escape asks the page to close it by
 * calling `onOpenChange(false)`.
 */
export const ClosesWithEscape: Story = {
	play: async ({ args, canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		const dialog = await page.findByRole("dialog", { name: beta.name });
		const onOpenChange = args.onOpenChange as ReturnType<typeof fn>;

		const expectedResult = { focusInside: true, closeRequest: false };

		await waitFor(() => {
			if (!dialog.contains(document.activeElement)) throw new Error("focus");
		});
		const focusInside = dialog.contains(document.activeElement);
		await userEvent.keyboard("{Escape}");
		const result = {
			focusInside,
			closeRequest: onOpenChange.mock.lastCall?.[0],
		};

		await expect(result).toEqual(expectedResult);
	},
};
