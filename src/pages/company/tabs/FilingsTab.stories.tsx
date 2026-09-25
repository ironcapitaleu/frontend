import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { sampleCompanyGateway } from "../../../lib/company/sampleCompanyGateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { FilingsTab } from "./FilingsTab";

const sample = sampleCompanyGateway();

/** A gateway whose Filings section never answers, so the card stays in its loading state. */
const loadingGateway: CompanyGateway = {
	...sample,
	getFilings: () => new Promise(() => {}),
};

/** A gateway whose Filings section holds no filing. */
const emptyGateway: CompanyGateway = {
	...sample,
	getFilings: async () => ({ filings: [] }),
};

/** A gateway whose Financials section fails while the other sections load. */
const financialsFailingGateway: CompanyGateway = {
	...sample,
	getFinancials: alwaysFailingCompanyGateway().getFinancials,
};

/** Finds the row of the filing with `accession` once the rows have drawn. */
async function rowOf(canvasElement: HTMLElement, accession: string) {
	await within(canvasElement).findAllByRole("link");
	return canvasElement.querySelector(
		`li[data-accession="${accession}"]`,
	) as HTMLElement;
}

const phone = { viewport: { value: "mobile1", isRotated: false } };

/**
 * The Filings tab for MRDN, from the sample gateway. Card 7.1 lists every
 * filing behind the page, newest first. Each row names the figures the filing feeds and links to SEC EDGAR.
 */
const meta: Meta<typeof FilingsTab> = {
	title: "Pages/CompanyPage/FilingsTab",
	component: FilingsTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: sample },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof FilingsTab>;

/** Play test: the numbered card title follows DESIGN.md §8 "Filings". */
export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const expectedResult = ["7.1 Filings We Read"];

		const headings = await within(canvasElement).findAllByRole("heading", {
			level: 2,
		});
		const result = headings.map((heading) => heading.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the FY2026 10-K row links to its EDGAR index, built from its accession number. */
export const EdgarLink: Story = {
	play: async ({ canvasElement }) => {
		const expectedResult =
			"https://edgar.example/Archives/edgar/data/1234567/000123456726000012/";

		const row = await rowOf(canvasElement, "0001234567-26-000012");
		const result = within(row).getByRole("link", {
			name: "Open the filing on SEC EDGAR",
		});

		await expect(result).toHaveAttribute("href", expectedResult);
	},
};

/** Play test: at 320 px, each link is at least 44 px tall and the page does not scroll sideways. */
export const Phone: Story = {
	globals: phone,
	play: async ({ canvasElement }) => {
		const links = await within(canvasElement).findAllByRole("link");

		const expectedResult = { tapTargets: true, pageScrolls: false };

		const result = {
			tapTargets: links.every(
				(target) => target.getBoundingClientRect().height >= 44,
			),
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the card shows a spinner while the Filings section loads. */
export const Loading: Story = {
	parameters: { companyGateway: loadingGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "Loading the filings";

		const result = within(canvasElement).getByRole("status");

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/** Play test: the card says so when the Filings section fails to load. */
export const Failed: Story = {
	parameters: { companyGateway: alwaysFailingCompanyGateway() },
	play: async ({ canvasElement }) => {
		const expectedResult = "The filings did not load.";

		const result = await within(canvasElement).findByText(/did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: the card says so when the Filings section holds no filing. */
export const Empty: Story = {
	parameters: { companyGateway: emptyGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "No filing feeds a figure on this page yet.";

		const result = await within(canvasElement).findByText(/No filing/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: the 8-K that declares the dividend feeds only the printed page, so its row says it feeds no figure on this screen. */
export const FeedsNoFigure: Story = {
	play: async ({ canvasElement }) => {
		await within(canvasElement).findAllByText(/Owns: Subsidiaries/);
		const row = await rowOf(canvasElement, "0001234567-26-000026");

		const expectedResult = "Feeds no figure on this screen";

		const result = within(row).getByText(/^Feeds/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: when the Financials section fails, the FY2026 10-K row keeps the
 * figures of the sections that loaded and names no Financials figure.
 */
export const FinancialsFailed: Story = {
	parameters: { companyGateway: financialsFailingGateway },
	play: async ({ canvasElement }) => {
		const row = await rowOf(canvasElement, "0001234567-26-000012");

		const expectedResult =
			"Feeds Overview: The Business, Relationships: Owns: Subsidiaries";

		const result = await within(row).findByText(
			(_, element) =>
				element?.tagName === "P" && element.textContent === expectedResult,
		);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
