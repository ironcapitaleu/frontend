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

		// A probe carrying the loss class gives the color the token resolves to,
		// so a swapped gain and loss tone fails.
		const probe = document.createElement("span");
		probe.className = "text-negative";
		canvasElement.append(probe);
		const lossColor = getComputedStyle(probe).color;
		probe.remove();

		const expectedResult = { value: "−5.0%", color: lossColor };

		// Deviation from TESTING.md §2.2: a median has no role of its own, so
		// it is read from the first `dd` beside its label.
		const loss = (
			canvas.getByText("Median 1M").parentElement as HTMLElement
		).querySelector("dd") as HTMLElement;
		const result = {
			value: loss.textContent,
			color: getComputedStyle(loss).color,
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

		// Deviation from TESTING.md §2.2: a `dl` has no role to query by, so
		// the grid is found by its tag.
		const grid = canvasElement.querySelector("dl") as HTMLElement;
		const result = getComputedStyle(grid).gridTemplateColumns.split(" ").length;

		await expect(result).toBe(expectedResult);
	},
};

/** At a desktop width the strip holds all four cells on one row. */
export const Desktop: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const expectedResult = 4;

		// Deviation from TESTING.md §2.2: a `dl` has no role to query by, so
		// the grid is found by its tag.
		const grid = canvasElement.querySelector("dl") as HTMLElement;
		const result = getComputedStyle(grid).gridTemplateColumns.split(" ").length;

		await expect(result).toBe(expectedResult);
	},
};
