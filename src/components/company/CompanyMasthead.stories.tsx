import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

import { meridianMasthead } from "@/lib/company/sample/masthead";
import { CompanyMasthead } from "./CompanyMasthead";

/**
 * The masthead of the company page for the sample company Meridian
 * Semiconductor. The stories cover the desktop and the phone width, the
 * Export button at both widths, and a masthead with missing figures.
 */
const meta: Meta<typeof CompanyMasthead> = {
	title: "Company/CompanyMasthead",
	component: CompanyMasthead,
	tags: ["autodocs"],
	args: { masthead: meridianMasthead, onExport: fn() },
	decorators: [
		(Story) => (
			<div className="p-6">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof CompanyMasthead>;

/** Every figure is present. The desktop shows all three listings and the fiscal year end. */
export const Desktop: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = { fiscalYearEnd: true, otherListings: false };

		const result = {
			fiscalYearEnd: canvas.getByText(/Fiscal year ends/).checkVisibility(),
			otherListings: canvas.getByText("+2 listings").checkVisibility(),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** On a phone the masthead shows the first listing with "+2 listings" and drops the fiscal year end. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = {
			fiscalYearEnd: false,
			secondListing: false,
			otherListings: true,
		};

		const result = {
			fiscalYearEnd: canvas.getByText(/Fiscal year ends/).checkVisibility(),
			secondListing: canvas.getByText("XETRA: MRD").checkVisibility(),
			otherListings: canvas.getByText("+2 listings").checkVisibility(),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** On a desktop the Export button shows its icon and its label. */
export const ExportOnDesktop: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "Export";

		const result = canvas
			.getByRole("button", { name: "Export" })
			.innerText.trim();

		await expect(result).toBe(expectedResult);
	},
};

/** On a phone the Export button shows its icon only, and keeps its name for a screen reader. */
export const ExportOnPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "";

		const result = canvas
			.getByRole("button", { name: "Export" })
			.innerText.trim();

		await expect(result).toBe(expectedResult);
	},
};

/** The price and the 52-week low are missing, so each shows a dimmed `—`. */
export const MissingFigures: Story = {
	args: {
		masthead: { ...meridianMasthead, price: null, low52Weeks: null },
	},
};

/** Without `onExport`, as on every tab but Overview, the masthead shows no Export button. */
export const WithoutExport: Story = {
	args: { onExport: undefined },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = null;

		const result = canvas.queryByRole("button", { name: "Export" });

		await expect(result).toBe(expectedResult);
	},
};
