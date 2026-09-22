import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, within } from "storybook/test";

import StockScreener from "./StockScreener";
import type { Stock } from "./StockScreener.logic";

/** Three rows: a gain, a loss, and a month that rounds to flat. */
const GAIN_LOSS_FLAT: readonly Stock[] = [
	{
		symbol: "GAIN",
		name: "Gain Corp.",
		sector: "Technology",
		country: "US",
		price: 120,
		marketCap: 50_000_000_000,
		changePercent1M: 2.4,
		peRatio: 18,
		priceToCash: 12,
		priceToFcf: 15,
		quickRatio: 1.2,
		currentRatio: 1.5,
		buybackYield: 1,
		dividendYield: 1.5,
		weekLow52: 90,
		weekHigh52: 140,
	},
	{
		symbol: "LOSS",
		name: "Loss Industries",
		sector: "Energy",
		country: "DE",
		price: 45,
		marketCap: 8_000_000_000,
		changePercent1M: -3.1,
		peRatio: 9,
		priceToCash: 6,
		priceToFcf: 8,
		quickRatio: 0.9,
		currentRatio: 1.1,
		buybackYield: 3,
		dividendYield: 4,
		weekLow52: 40,
		weekHigh52: 70,
	},
	{
		symbol: "FLAT",
		name: "Flat Holdings",
		sector: "Finance",
		country: "GB",
		price: 30,
		marketCap: 2_000_000_000,
		changePercent1M: 0.04,
		peRatio: 11,
		priceToCash: null,
		priceToFcf: null,
		quickRatio: null,
		currentRatio: null,
		buybackYield: 2,
		dividendYield: 3,
		weekLow52: 25,
		weekHigh52: 35,
	},
];

/**
 * The screener page with its built-in sample universe. The 1M column shows
 * gains in the `positive` token and losses in the `negative` token, so the
 * theme toggle checks both colors in light and dark. The decorator mirrors
 * `Layout` (a full-height flex column), and a router backs the row links.
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

/** The sample universe, with both gains and losses in the 1M column. */
export const Default: Story = {};

/**
 * A gain, a loss, and a flat month. The flat row reads 0.0% in the neutral
 * ink, because its 0.04% change rounds to zero on screen.
 */
export const GainLossFlat: Story = {
	args: { stocks: GAIN_LOSS_FLAT },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const toneOf = (text: string) => {
			const classes = canvas.getByText(text).closest("td")?.className ?? "";
			if (classes.includes("text-positive")) return "positive";
			if (classes.includes("text-negative")) return "negative";
			return "neutral";
		};

		const expectedResult = {
			gain: "positive",
			loss: "negative",
			flat: "neutral",
		};

		const result = {
			gain: toneOf("+2.4%"),
			loss: toneOf("-3.1%"),
			flat: toneOf("0.0%"),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** A phone width. The table scrolls sideways inside its frame. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};
