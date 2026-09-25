import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { BAR_TARGETS_OK, barTargetsOf } from "../../../test/barTargets";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { ShareholderReturnsTab } from "./ShareholderReturnsTab";

const failingGateway = alwaysFailingCompanyGateway();

/** A gateway for a company that paid no dividend in any fiscal year. */
const noDividendGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getShareholderReturns: async () => {
		const returns = fakeCompanyReport.shareholderReturns;
		const series = returns.dividendPerShare;
		const points = series.points.map(
			(point) => point && { ...point, value: 0 },
		);
		return { ...returns, dividendPerShare: { ...series, points } };
	},
};

/** A gateway whose filings report no dividend figure in any year. */
const noFiguresGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getShareholderReturns: async () => {
		const returns = fakeCompanyReport.shareholderReturns;
		const series = returns.dividendPerShare;
		const points = series.points.map(() => null);
		return { ...returns, dividendPerShare: { ...series, points } };
	},
};

/** A gateway whose only non-zero dividend figure is not a finite number. */
const infiniteGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getShareholderReturns: async () => {
		const returns = fakeCompanyReport.shareholderReturns;
		const series = returns.dividendPerShare;
		const points = series.points.map((point, index) =>
			point
				? { ...point, value: index === 9 ? Number.POSITIVE_INFINITY : 0 }
				: point,
		);
		return { ...returns, dividendPerShare: { ...series, points } };
	},
};

/** A gateway with no FY2020 dividend and a dividend of 0 in FY2021. */
const gapAndZeroGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getShareholderReturns: async () => {
		const returns = fakeCompanyReport.shareholderReturns;
		const series = returns.dividendPerShare;
		const points = series.points.map((point, index) =>
			index === 4
				? null
				: index === 5 && point
					? { ...point, value: 0 }
					: point,
		);
		return { ...returns, dividendPerShare: { ...series, points } };
	},
};

/**
 * The Shareholder returns tab for MRDN, from the fake gateway of the test
 * fixtures unless a story sets its own (DESIGN.md §8 "Shareholder returns").
 * Card 4.1 draws the dividend per share declared for each fiscal year. It
 * takes one column on a desktop and the full width on a phone. The sources
 * index at the foot lists the filings behind the tab.
 */
const meta: Meta<typeof ShareholderReturnsTab> = {
	title: "Pages/CompanyPage/ShareholderReturnsTab",
	component: ShareholderReturnsTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: alwaysFoundCompanyGateway() },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ShareholderReturnsTab>;

/** The loaded tab. Its card titles follow DESIGN.md §8. */
export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = ["4.1 Dividend per Share"];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: on a phone, every bar of card 4.1 has a tap target at least
 * 24 px wide and tall inside the plot, every bar draws, and the chart
 * scrolls inside its card, so the page does not scroll sideways.
 */
export const LoadedOnPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const plot = await within(canvasElement).findByRole("list", {
			name: "Fiscal years",
		});

		const expectedResult = BAR_TARGETS_OK;

		const result = barTargetsOf(plot);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the "Data" table of card 4.1 shows the figures its chart draws, year by year. */
export const DataTable: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const plot = await canvas.findByRole("list", { name: "Fiscal years" });

		const expectedResult = within(plot)
			.getAllByRole("listitem")
			.map((group) => group.textContent?.replace(/^.*: /, ""));

		await userEvent.click(canvas.getByRole("button", { name: "Data" }));
		const table = await canvas.findByRole("table", {
			name: "Dividend per Share table",
		});
		const result = within(table)
			.getAllByRole("cell")
			.map((cell) => cell.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: a missing FY2020 leaves a gap with no bar, and the 0 of FY2021
 * still draws a bar that opens its sources.
 */
export const GapAndZero: Story = {
	parameters: { companyGateway: gapAndZeroGateway },
	play: async ({ canvasElement }) => {
		const plot = await within(canvasElement).findByRole("list", {
			name: "Fiscal years",
		});

		const expectedResult = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1];

		const result = within(plot)
			.getAllByRole("listitem")
			.map((group) => within(group).queryAllByRole("button").length);

		await expect(result).toEqual(expectedResult);
	},
};

/** The loaded tab in the dark theme. */
export const LoadedDark: Story = {
	globals: { theme: "dark" },
};

/** Play test: a company that paid no dividend shows one line in place of the chart. */
export const NoDividend: Story = {
	parameters: { companyGateway: noDividendGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult =
			"The company paid no dividend in these fiscal years.";

		const result = await canvas.findByText(/paid no dividend/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** A company that paid no dividend, at a phone width. */
export const NoDividendOnPhone: Story = {
	...NoDividend,
	globals: { viewport: { value: "mobile1", isRotated: false } },
};

/**
 * Play test: when the filings report no dividend figure at all, the card draws
 * the chart with its dashes and never says the company paid no dividend,
 * since missing data is not a zero dividend.
 */
export const NoFiguresReported: Story = {
	parameters: { companyGateway: noFiguresGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByRole("list", { name: "Fiscal years" });

		const expectedResult = null;

		const result = canvas.queryByText(/paid no dividend/);

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: a dividend figure that is not a finite number is not a
 * dividend, so a series of zeros with one such figure still reads as no
 * dividend paid.
 */
export const InfiniteFigure: Story = {
	parameters: { companyGateway: infiniteGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult =
			"The company paid no dividend in these fiscal years.";

		const result = await canvas.findByText(/paid no dividend/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** The sections are still loading. */
export const Loading: Story = {
	parameters: {
		companyGateway: {
			...failingGateway,
			getShareholderReturns: () => new Promise(() => {}),
		},
	},
};

/** A section request did not complete. */
export const Failed: Story = {
	parameters: { companyGateway: failingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "The shareholder returns figures did not load.";

		const result = await canvas.findByText(/did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
