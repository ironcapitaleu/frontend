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

		const expectedResult = { value: "−5.0%", tinted: true };

		// Deviation from TESTING.md §2.2: a median has no role of its own, so
		// it is read from the first `dd` beside its label.
		const median = (label: string) =>
			(canvas.getByText(label).parentElement as HTMLElement).querySelector(
				"dd",
			) as HTMLElement;
		const loss = median("Median 1M");
		const result = {
			value: loss.textContent,
			// The loss paints in a different color from a neutral median.
			tinted:
				getComputedStyle(loss).color !==
				getComputedStyle(median("Median P/E")).color,
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
	play: async ({ canvasElement }) => {
		const expectedResult = 2;

		// Deviation from TESTING.md §2.2: the column count is layout, so it is
		// read from the grid's computed style in the browser.
		const grid = canvasElement.querySelector("dl") as HTMLElement;
		const result = getComputedStyle(grid).gridTemplateColumns.split(" ").length;

		await expect(result).toBe(expectedResult);
	},
};
