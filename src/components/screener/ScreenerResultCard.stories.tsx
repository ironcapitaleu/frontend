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
 * The whole card is one button. It is at least 44 px tall, and a hairline
 * separates it from the next card in the list. All stories render at a phone
 * width.
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
