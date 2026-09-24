import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { CompanyCard, CompanyCardGrid } from "./CompanyCard";

/** The "Data" button and the "Sources" chip, as a chart card carries them. */
const actions = (
	<>
		<Button size="sm" variant="outline">
			Data
		</Button>
		<Button size="sm" variant="ghost">
			Sources
		</Button>
	</>
);

/**
 * One card of a company page tab. The title carries the tab's row and the
 * card's place in the tab. The caption names the period, the unit and the
 * filing. The "Data" button and the "Sources" chip sit at the right of the
 * title, and on a phone the button sits above the chip.
 */
const meta: Meta<typeof CompanyCard> = {
	title: "Company/CompanyCard",
	component: CompanyCard,
	tags: ["autodocs"],
	args: {
		tab: "shareholderReturns",
		position: 3,
		title: "Buybacks Net of Shares Issued to Staff",
		caption: "FY2016–FY2025 · USD · 10-K",
		actions,
		children: <div className="h-40 rounded-md bg-muted" />,
	},
};

export default meta;
type Story = StoryObj<typeof CompanyCard>;

/** Play test: the title carries the number 4.3, from the Shareholder returns row. */
export const Default: Story = {
	play: async ({ canvasElement }) => {
		const expectedResult = "4.3 Buybacks Net of Shares Issued to Staff";

		const result = within(canvasElement).getByRole("heading", { level: 3 });

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: on a phone, the "Data" button sits above the "Sources" chip. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const data = canvas.getByRole("button", { name: "Data" });
		const sources = canvas.getByRole("button", { name: "Sources" });

		const expectedResult = true;

		const result =
			data.getBoundingClientRect().bottom <=
			sources.getBoundingClientRect().top;

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: on a desktop, a card with `span={2}` takes both columns of the
 * grid, and the two cards below it share one row.
 */
export const Grid: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	render: () => (
		<CompanyCardGrid>
			<CompanyCard
				tab="financials"
				position={1}
				title="Income Statement"
				caption="FY2016–FY2025 · USD · 10-K"
				actions={actions}
				span={2}
			>
				<div className="h-40 rounded-md bg-muted" />
			</CompanyCard>
			<CompanyCard
				tab="financials"
				position={2}
				title="Balance Sheet"
				caption="FY2025 · USD · 10-K"
			>
				<div className="h-24 rounded-md bg-muted" />
			</CompanyCard>
			<CompanyCard
				tab="financials"
				position={3}
				title="Cash Flow"
				caption="FY2025 · USD · 10-K"
			>
				<div className="h-24 rounded-md bg-muted" />
			</CompanyCard>
		</CompanyCardGrid>
	),
	play: async ({ canvasElement }) => {
		const cards = within(canvasElement).getAllByRole("region");

		const expectedResult = [true, true];

		const result = [
			cards[0].getBoundingClientRect().bottom <=
				cards[1].getBoundingClientRect().top,
			cards[1].getBoundingClientRect().top ===
				cards[2].getBoundingClientRect().top,
		];

		await expect(result).toEqual(expectedResult);
	},
};
