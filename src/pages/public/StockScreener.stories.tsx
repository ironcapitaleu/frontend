import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, userEvent, within } from "storybook/test";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import StockScreener from "./StockScreener";

/**
 * The screener page. "The Screener" is the page's one serif title, above the
 * search bar and the strategy presets. From 1024 px the filter rail sits left
 * of the results. Below it, the rail moves into a sheet behind the "Filters"
 * button. Below 768 px, the table becomes a list of result cards.
 *
 * The stories use the built-in sample universe unless they state otherwise.
 * The decorator mirrors `Layout` (a full-height flex column), and a router
 * backs the company links.
 */
const meta: Meta<typeof StockScreener> = {
	title: "Pages/StockScreener",
	component: StockScreener,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<div className="min-h-screen flex flex-col">
					<Story />
				</div>
			</MemoryRouter>
		),
	],
	argTypes: {
		stocks: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof StockScreener>;

/** The whole sample universe with no filter applied. */
export const Default: Story = {};

/** A phone width: the presets scroll sideways and the results are cards. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// The table hides below 768 px, so an accessible query finds only the
		// card list. This also fails if the story viewport stops applying.
		const expectedResult = { table: null, sortMenu: true };

		const result = {
			table: canvas.queryByRole("table"),
			sortMenu: canvas.queryByRole("combobox", { name: "Sort" }) !== null,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** A tablet width: the rail waits behind the "Filters" button. */
export const Tablet: Story = {
	globals: { viewport: { value: "tablet", isRotated: false } },
};

/** The "Income at a fair price" preset applied, with its two filter chips. */
export const WithPreset: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "true";

		await userEvent.click(
			canvas.getByRole("button", { name: "Income at a fair price" }),
		);
		const result = canvas
			.getByRole("button", { name: "Income at a fair price" })
			.getAttribute("aria-pressed");

		await expect(result).toBe(expectedResult);
	},
};

/** A search that matches no company. The results say so plainly. */
export const Empty: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "0 of 12 companies";

		await userEvent.type(
			canvas.getByRole("searchbox", { name: "Search by ticker or company" }),
			"ZZZZ",
		);
		const result =
			canvas.getByText(/of \d+ companies/).parentElement?.textContent;

		await expect(result).toBe(expectedResult);
	},
};

/**
 * The main flow on the test fixture: apply a preset, remove one of its chips,
 * then select a result. The count follows each step and the preview opens on
 * the selected company.
 */
export const PresetChipAndPreview: Story = {
	args: { stocks: fakeStockScreenerResults },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(canvasElement.ownerDocument.body);
		const count = () =>
			canvas.getByText(/of \d+ companies/).parentElement?.textContent;

		const expectedResult = {
			afterPreset: "2 of 5 companies",
			afterChipRemoved: "3 of 5 companies",
			preview: "Beta Industries",
		};

		await userEvent.click(
			canvas.getByRole("button", { name: "Income at a fair price" }),
		);
		const afterPreset = count();
		await userEvent.click(
			canvas.getByRole("button", { name: "Remove Dividend yield filter" }),
		);
		const afterChipRemoved = count();
		await userEvent.click(canvas.getByRole("button", { name: /^BETA/ }));
		const dialog = await page.findByRole("dialog");
		const result = {
			afterPreset,
			afterChipRemoved,
			preview: dialog.querySelector("h2")?.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};
