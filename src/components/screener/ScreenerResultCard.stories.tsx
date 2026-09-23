import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { ScreenerResultCard } from "./ScreenerResultCard";

const [alfa, beta, gamma] = fakeStockScreenerResults;

/**
 * A screener result on a phone. The card replaces a table row below 768 px:
 * ticker and name, price and 1M change, three key figures, and the 52-week
 * range. The third figure follows the sort, and its label turns to full ink.
 *
 * A tap anywhere on the card opens the preview, and the ticker is the button
 * for the keyboard. The list draws the hairlines between cards. All stories
 * render at a phone width.
 */
const meta: Meta<typeof ScreenerResultCard> = {
	title: "Screener/ScreenerResultCard",
	component: ScreenerResultCard,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	globals: { viewport: { value: "mobile1", isRotated: false } },
	args: {
		stock: alfa,
		highlightField: "dividendYield",
		onSelect: fn(),
	},
	argTypes: {
		highlightField: {
			control: "select",
			options: [
				"marketCap",
				"priceToCash",
				"quickRatio",
				"currentRatio",
				"dividendYield",
				"buybackYield",
			],
			description: "The third key figure, usually the sort column.",
		},
		stock: { control: { disable: true } },
		onSelect: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	decorators: [
		(Story) => (
			<div className="max-w-sm">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A company that lost 5% last month. The change reads in `negative`. */
export const Loss: Story = {};

/** A company that gained last month. The change reads in `positive`. */
export const Gain: Story = {
	args: { stock: beta, highlightField: "buybackYield" },
};

/** A company with missing metrics. Each missing figure reads as a dimmed dash. */
export const MissingMetrics: Story = {
	args: { stock: gamma },
};

/**
 * Sorted by a figure with a long name. The card uses the short label, so
 * even the longest one fits its column.
 */
export const LongHighlightLabel: Story = {
	args: { highlightField: "currentRatio" },
};

/** The card whose preview is open. It carries the thin accent mark. */
export const Selected: Story = {
	args: { selected: true },
};

/** Three cards in a list. The list draws the hairlines between them. */
export const InAList: Story = {
	render: (args) => (
		<div className="divide-y divide-border">
			{[alfa, beta, gamma].map((stock) => (
				<ScreenerResultCard key={stock.symbol} {...args} stock={stock} />
			))}
		</div>
	),
};

/**
 * The 52-week range sits outside the ticker button, so a screen reader finds
 * it as a meter with its own name.
 */
export const RangeIsAMeter: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "$100.00, between $90.00 and $160.00";

		const result = canvas
			.getByRole("meter", { name: "ALFA 52-week range" })
			.getAttribute("aria-valuetext");

		await expect(result).toBe(expectedResult);
	},
};

/** Tapping the card reports its symbol, so the page opens the preview. */
export const SelectsOnTap: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "ALFA";

		await userEvent.click(canvas.getByRole("button", { name: /^ALFA/ }));
		const result = (args.onSelect as ReturnType<typeof fn>).mock.lastCall?.[0];

		await expect(result).toBe(expectedResult);
	},
};
