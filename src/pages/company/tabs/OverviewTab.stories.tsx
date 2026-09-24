import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { OverviewTab } from "./OverviewTab";

const failingGateway = alwaysFailingCompanyGateway();
/** A gateway whose two Overview loads never answer, so both cards stay loading. */
const pending = (): Promise<never> => new Promise(() => {});
const neverAnsweringGateway: CompanyGateway = {
	...failingGateway,
	getOverview: pending,
	getFinancials: pending,
};

/**
 * The Overview tab with the sample data of Meridian Semiconductor (MRDN).
 * It draws card 1.1 "The Business" and card 1.2 "Ten Years at a Glance".
 * A story sets its gateway in `parameters`. Without one, the tab reads the
 * default sample gateway.
 */
const meta: Meta<typeof OverviewTab> = {
	title: "Pages/Company/OverviewTab",
	component: OverviewTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { layout: "padded" },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof OverviewTab>;

/** Play test: the card titles carry the numbers of DESIGN.md §8 "Overview". */
export const Loaded: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByText("Diluted shares");

		const expectedResult = ["1.1 The Business", "1.2 Ten Years at a Glance"];

		const result = canvas
			.getAllByRole("heading", { level: 2 })
			.map((heading) => heading.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: on a phone the small charts sit two to a row. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		await within(canvasElement).findByText("Diluted shares");
		const charts = canvasElement.querySelectorAll(
			'[data-slot="mini-bar-chart"]',
		);

		const expectedResult = 2;

		const result = new Set(
			[...charts].map((chart) => chart.getBoundingClientRect().top),
		).size;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a click on a segment's share pins the source card of that share. */
export const SegmentSource: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole("button", { name: "81.0%" }));

		const expectedResult = "Sources of Data centre share of revenue";

		const result = await screen.findByRole("dialog");

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/** Play test: each card shows a spinner while its section loads. */
export const Loading: Story = {
	parameters: { companyGateway: neverAnsweringGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = 2;

		const result = within(canvasElement).getAllByRole("status").length;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a card whose section fails says so in one line. */
export const Failed: Story = {
	parameters: { companyGateway: failingGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "The business did not load. Try again in a moment.";

		const result = await within(canvasElement).findByText(expectedResult);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
