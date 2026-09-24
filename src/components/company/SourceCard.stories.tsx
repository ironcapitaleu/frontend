import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { priceChangeOneMonth } from "@/lib/company/metrics";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { meridianMasthead } from "@/lib/company/sample/masthead";
import { meridianOverview } from "@/lib/company/sample/overview";
import type { Claim, DerivedSource } from "@/lib/company/types";
import { SourceCard, SourceTrigger } from "./SourceCard";

const revenue = meridianFinancials.income.annual.lines[0].points.at(
	-1,
) as Claim;
const priceChange = priceChangeOneMonth(meridianMasthead) as Claim;
const price = meridianMasthead.price as Claim;
/** One fund's 13F-HR holding. An information table reports no XBRL fact. */
const fundHolding = (
	(meridianOverview.ownership.institutionShares as Claim)
		.source as DerivedSource
).inputs[0];
/** A derived claim whose first input is itself derived, so the card walks two levels. */
const nested: Claim = {
	id: "story.nested",
	label: "Price change against revenue",
	value: 0,
	unit: "ratio",
	period: null,
	source: {
		kind: "derived",
		formula: "Price change over one month ÷ Revenue",
		inputs: [priceChange, revenue],
	},
};

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

/**
 * Play test: resting the pointer on a price previews its card. A price is
 * market data, so the card names the dataset and no XBRL tag.
 */
export const MarketData: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	args: { claim: price, children: "$210.60" },
	play: async ({ canvasElement }) => {
		await userEvent.hover(within(canvasElement).getByRole("button"));

		const expectedResult = "End-of-day prices, NASDAQ";

		const result = await screen.findByRole("dialog");

		await expect(result).toHaveTextContent(expectedResult);
	},
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

/** Renders the card body alone, framed as the popover frames it. */
function renderCard({ claim }: { claim: Claim }) {
	return (
		<div className="w-100 max-w-full rounded-md border border-border bg-popover p-4 font-sans text-base text-popover-foreground">
			<SourceCard claim={claim} />
		</div>
	);
}

/** The card alone: a figure reported in a 10-K names the filing, the line and the XBRL tag. */
export const CardReported: Story = {
	args: { claim: revenue },
	render: renderCard,
};

/** The card alone: a 13F-HR information table reports no XBRL fact, so the card names the line alone. */
export const CardNoXbrl: Story = {
	args: { claim: fundHolding },
	render: renderCard,
};

/** The card alone: a price is market data, so the card names the dataset and links to it. */
export const CardMarketData: Story = {
	args: { claim: price },
	render: renderCard,
};

/** The card alone: a derived figure shows its formula and the source of each input. */
export const CardDerived: Story = {
	args: { claim: priceChange },
	render: renderCard,
};

/** The card alone: an input that is itself derived shows its own formula and inputs. */
export const CardNested: Story = {
	args: { claim: nested },
	render: renderCard,
};
