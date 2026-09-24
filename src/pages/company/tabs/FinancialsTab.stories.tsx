import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { FinancialsTab } from "./FinancialsTab";

const pending = (): Promise<never> => new Promise(() => {});

/** A gateway whose Financials section never answers, so the tab stays loading. */
const neverAnsweringGateway: CompanyGateway = {
	getMasthead: pending,
	getOverview: pending,
	getFinancials: pending,
	getValuation: pending,
	getShareholderReturns: pending,
	getRelationships: pending,
	getManagement: pending,
	getFilings: pending,
};

/**
 * The Financials tab for Meridian Semiconductor (MRDN), from the sample
 * gateway. The control row picks the statement, the annual or quarterly view
 * and the unit. The statement table card shows the chosen table, and every
 * cell opens the sources of its figure.
 */
const meta: Meta<typeof FinancialsTab> = {
	title: "Pages/CompanyPage/FinancialsTab",
	component: FinancialsTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: undefined },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof FinancialsTab>;

/**
 * Play test: the card title follows the statement switch and carries the
 * number 2.2, the second card of the Financials row (DESIGN.md §8).
 */
export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const title = async () =>
			(await canvas.findByRole("heading", { name: /^2\.2 / })).textContent;

		const expectedResult = [
			"2.2 Income Statement",
			"2.2 Balance Sheet",
			"2.2 Cash Flow",
		];

		const result = [await title()];
		await userEvent.click(
			canvas.getByRole("button", { name: "Balance sheet" }),
		);
		result.push(await title());
		await userEvent.click(canvas.getByRole("button", { name: "Cash flow" }));
		result.push(await title());

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the quarterly view shows eight quarter columns, newest last. */
export const Quarterly: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			await canvas.findByRole("button", { name: "Quarterly" }),
		);

		const expectedResult = 8;

		const result = canvas
			.getAllByRole("columnheader")
			.filter((header) =>
				/^Q\d FY\d{4}$/.test(header.textContent ?? ""),
			).length;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a click on a figure pins its source card. */
export const FigureSources: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const line = await canvas.findByRole("rowheader", { name: "Revenue" });
		const figure = within(line.closest("tr") as HTMLElement).getAllByRole(
			"button",
		)[0];

		const expectedResult = "Sources of Revenue";

		await userEvent.click(figure);
		const result = await within(canvasElement.ownerDocument.body).findByRole(
			"dialog",
		);

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/**
 * Play test: at 390 px the page does not scroll sideways. The table scrolls
 * inside its card, and the line names stay fixed at its left edge.
 */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const line = await canvas.findByRole("rowheader", { name: "Revenue" });
		const scroller = line.closest("[data-slot=table-container]") as HTMLElement;
		const left = line.getBoundingClientRect().left;
		scroller.scrollLeft = scroller.scrollWidth;
		await new Promise(requestAnimationFrame);

		const expectedResult = {
			pageScrolls: false,
			tableScrolls: true,
			fixed: left,
		};

		const result = {
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
			tableScrolls: scroller.scrollLeft > 0,
			fixed: line.getBoundingClientRect().left,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** The Financials section is still loading. */
export const Loading: Story = {
	parameters: { companyGateway: neverAnsweringGateway },
};

/** Play test: a failed load says so. */
export const Failed: Story = {
	parameters: { companyGateway: alwaysFailingCompanyGateway() },
	play: async ({ canvasElement }) => {
		const expectedResult = /did not load/;

		const result = await within(canvasElement).findByText(expectedResult);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
