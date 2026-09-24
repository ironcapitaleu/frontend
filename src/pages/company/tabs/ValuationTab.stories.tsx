import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { ValuationTab } from "./ValuationTab";

const failingGateway = alwaysFailingCompanyGateway();
/** Fails every section but the valuation, which never answers. */
const pendingGateway: CompanyGateway = {
	...failingGateway,
	getValuation: () => new Promise(() => {}),
};

/**
 * The Valuation tab for MRDN from the sample gateway (DESIGN.md §8
 * "Valuation"). Card 3.1 draws each ratio now on a bar of its own ten years
 * and a bar of the sector quartiles.
 */
const meta: Meta<typeof ValuationTab> = {
	title: "Pages/CompanyPage/ValuationTab",
	component: ValuationTab,
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
type Story = StoryObj<typeof ValuationTab>;

/** The loaded tab. Its card titles follow DESIGN.md §8. */
export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [
			"3.1 Ratios Against Their Own Ten Years and the Sector",
		];

		const result = (await canvas.findAllByRole("region")).map(
			(card) => within(card).getByRole("heading", { level: 2 }).textContent,
		);

		await expect(result).toEqual(expectedResult);
	},
};

/** The loaded tab at a phone width. The range bars stack under each ratio name. */
export const LoadedOnPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByRole("region");

		const expectedResult = true;

		const result =
			canvasElement.scrollWidth <= canvasElement.ownerDocument.body.clientWidth;

		await expect(result).toBe(expectedResult);
	},
};

/** The sections are still loading. */
export const Loading: Story = {
	parameters: { companyGateway: pendingGateway },
};

/** A section request did not complete. */
export const Failed: Story = {
	parameters: { companyGateway: failingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "The valuation figures did not load.";

		const result = await canvas.findByText(/did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
