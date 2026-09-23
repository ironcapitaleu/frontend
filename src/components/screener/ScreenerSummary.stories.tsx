import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { ScreenerSummary } from "./ScreenerSummary";

/**
 * The strip of medians above the screener results. Each cell prints the
 * median of the result set in mono, with the universe median below it for
 * comparison. The 1M cell takes the `positive` or `negative` token.
 *
 * Hairlines between the cells come from a 1 px gap over the `border` token,
 * so the lines stay even when the strip wraps from four columns to two.
 */
const meta: Meta<typeof ScreenerSummary> = {
	title: "Screener/ScreenerSummary",
	component: ScreenerSummary,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	args: {
		matched: fakeStockScreenerResults.filter(
			(stock) => stock.changePercent1M < 0,
		),
		universe: fakeStockScreenerResults,
	},
	argTypes: {
		matched: { control: { disable: true } },
		universe: { control: { disable: true } },
		className: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A screen of the three stocks that fell last month. The 1M median is a loss. */
export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = { value: "−5.0%", negative: true };

		// Deviation from TESTING.md §2.2: the tone is a color class, so the
		// median is read from its cell and its class checked directly.
		const cell = canvas.getByText("Median 1M").parentElement as HTMLElement;
		const value = cell.querySelector("dd") as HTMLElement;
		const result = {
			value: value.textContent,
			negative: value.classList.contains("text-negative"),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Every stock matches, so each cell equals its universe median. */
export const WholeUniverse: Story = {
	args: { matched: fakeStockScreenerResults },
};

/** No stock matches. Every median reads `—` in a neutral tone. */
export const Empty: Story = {
	args: { matched: [] },
};

/** At a phone width the strip wraps into two columns of two cells. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};
