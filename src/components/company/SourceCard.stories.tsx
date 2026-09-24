import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { priceChangeOneMonth } from "@/lib/company/metrics";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { meridianMasthead } from "@/lib/company/sample/masthead";
import type { Claim } from "@/lib/company/types";
import { SourceTrigger } from "./SourceCard";

const revenue = meridianFinancials.income.annual.lines[0].points.at(
	-1,
) as Claim;
const priceChange = priceChangeOneMonth(meridianMasthead) as Claim;

/**
 * The source card of a figure on the company page, opened from the figure.
 * The reported figure is Meridian's latest annual revenue from its 10-K. The
 * derived figure is the masthead's price change over one month, whose inputs
 * are two closing prices. On a desktop, hover or focus previews the card and a
 * click pins it. On a phone, a tap opens it as a bottom sheet.
 */
const meta: Meta<typeof SourceTrigger> = {
	title: "Company/SourceCard",
	component: SourceTrigger,
	tags: ["autodocs"],
	args: { claim: revenue, children: "$212.0B" },
	decorators: [
		(Story) => (
			<p className="p-6 font-monospace text-lg">
				<Story />
			</p>
		),
	],
};

export default meta;
type Story = StoryObj<typeof SourceTrigger>;

/** Opens the card of the figure in the canvas with a click or a tap. */
async function openCard(canvasElement: HTMLElement): Promise<HTMLElement> {
	await userEvent.click(within(canvasElement).getByRole("button"));
	return screen.findByRole("dialog");
}

/** Waits until no card is open, and then returns the open card, which is `null`. */
async function cardClosed(): Promise<HTMLElement | null> {
	return waitFor(() => {
		const card = screen.queryByRole("dialog");
		if (card) throw new Error("The card is still open");
		return card;
	});
}

/** Play test: a click pins the card, so it stays open after the pointer leaves the figure. */
export const Reported: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		await openCard(canvasElement);
		await userEvent.unhover(within(canvasElement).getByRole("button"));

		const expectedResult = "us-gaap:Revenues";

		const result = await screen.findByRole("dialog");

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: `Escape` closes a pinned card. */
export const Derived: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	args: { claim: priceChange, children: "+4.1% 1M" },
	play: async ({ canvasElement }) => {
		await openCard(canvasElement);
		await userEvent.keyboard("{Escape}");

		const expectedResult = null;

		const result = await cardClosed();

		await expect(result).toBe(expectedResult);
	},
};

/** A price is market data, so the card names the dataset and no XBRL tag. */
export const MarketData: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	args: { claim: meridianMasthead.price as Claim, children: "$210.60" },
};

/** Play test: a tap opens the card as a bottom sheet, and its close button closes it. */
export const ReportedPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		await openCard(canvasElement);
		await userEvent.click(screen.getByRole("button", { name: "Close" }));

		const expectedResult = null;

		const result = await cardClosed();

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: on a phone, the sheet of a derived figure shows its formula. */
export const DerivedPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	args: { claim: priceChange, children: "+4.1% 1M" },
	play: async ({ canvasElement }) => {
		const expectedResult =
			"(Price − Price a month earlier) ÷ Price a month earlier";

		const result = await openCard(canvasElement);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
