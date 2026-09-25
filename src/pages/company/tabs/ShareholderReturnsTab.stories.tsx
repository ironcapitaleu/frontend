import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import type { Figure, LineKey } from "../../../lib/company/types";
import { Ticker } from "../../../lib/domain/ticker";
import { BAR_TARGETS_OK, barTargetsOf } from "../../../test/barTargets";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { ShareholderReturnsTab } from "./ShareholderReturnsTab";

const failingGateway = alwaysFailingCompanyGateway();

/** Returns the fake financials with each point of cash flow line `key` changed by `change`. */
function financialsWith(
	key: LineKey,
	change: (point: Figure, index: number) => Figure,
) {
	const { financials } = fakeCompanyReport;
	const annual = financials.cashFlow.annual;
	const lines = annual.lines.map((line) =>
		line.key === key ? { ...line, points: line.points.map(change) } : line,
	);
	const cashFlow = { ...financials.cashFlow, annual: { ...annual, lines } };
	return { ...financials, cashFlow };
}

/** Returns the region of the card titled `title`, once it has loaded. */
function cardOf(canvasElement: HTMLElement, title: string) {
	return within(canvasElement).findByRole("region", { name: title });
}

/** Returns the bar list of the card titled `title`, once it has loaded. */
async function plotOf(canvasElement: HTMLElement, title: string) {
	const card = await cardOf(canvasElement, title);
	return within(card).findByRole("list", { name: "Fiscal years" });
}

const PER_SHARE = "4.1 Dividend per Share";
const PAYOUT = "4.2 Dividends Paid Against Free Cash Flow";

/** A gateway for a company that paid no dividend in any fiscal year. */
const noDividendGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () =>
		financialsWith("dividendsPaid", (point) => point && { ...point, value: 0 }),
	getShareholderReturns: async () => {
		const returns = fakeCompanyReport.shareholderReturns;
		const series = returns.dividendPerShare;
		const points = series.points.map(
			(point) => point && { ...point, value: 0 },
		);
		return { ...returns, dividendPerShare: { ...series, points } };
	},
};

/** A gateway with no FY2020 operating cash flow. */
const missingYearGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () =>
		financialsWith("operatingCashFlow", (point, index) =>
			index === 4 ? null : point,
		),
};

/** A gateway whose cash flow statement has no dividends paid line. */
const noPaidLineGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () => {
		const { financials } = fakeCompanyReport;
		const annual = financials.cashFlow.annual;
		const lines = annual.lines.filter(({ key }) => key !== "dividendsPaid");
		const cashFlow = { ...financials.cashFlow, annual: { ...annual, lines } };
		return { ...financials, cashFlow };
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
 * Card 4.1 draws the dividend per share declared for each fiscal year. Card
 * 4.2 sits beside it on a desktop and draws dividends paid as a share of free
 * cash flow. On a phone the two cards stack, 4.1 first. The sources
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

		const expectedResult = [PER_SHARE, PAYOUT];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: on a phone, every bar of cards 4.1 and 4.2 has a tap target at
 * least 24 px wide and tall inside the plot, every bar draws, and each chart
 * scrolls inside its card, so the page does not scroll sideways.
 */
export const LoadedOnPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const plots = [
			await plotOf(canvasElement, PER_SHARE),
			await plotOf(canvasElement, PAYOUT),
		];

		const expectedResult = [BAR_TARGETS_OK, BAR_TARGETS_OK];

		const result = plots.map(barTargetsOf);

		await expect(result).toEqual(expectedResult);
	},
};

/** Returns the play test that checks the "Data" table of the card titled `title` against its chart. */
function dataTableOf(title: string): Story["play"] {
	return async ({ canvasElement }) => {
		const card = within(await cardOf(canvasElement, title));
		const plot = await card.findByRole("list", { name: "Fiscal years" });

		const expectedResult = within(plot)
			.getAllByRole("listitem")
			.map((group) => group.textContent?.replace(/^.*: /, ""));

		await userEvent.click(card.getByRole("button", { name: "Data" }));
		const name = `${title.replace(/^\d+\.\d+ /, "")} table`;
		const table = await card.findByRole("table", { name });
		const result = within(table)
			.getAllByRole("cell")
			.map((cell) => cell.textContent);

		await expect(result).toEqual(expectedResult);
	};
}

/** Play test: the "Data" table of card 4.1 shows the figures its chart draws, year by year. */
export const DataTable: Story = { play: dataTableOf(PER_SHARE) };

/** Play test: the "Data" table of card 4.2 shows the shares its chart draws, year by year. */
export const PayoutDataTable: Story = { play: dataTableOf(PAYOUT) };

/** Play test: a missing FY2020 operating cash flow leaves a gap with no bar in card 4.2. */
export const PayoutMissingYear: Story = {
	parameters: { companyGateway: missingYearGateway },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, PAYOUT);

		const expectedResult = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1];

		const result = within(plot)
			.getAllByRole("listitem")
			.map((group) => within(group).queryAllByRole("button").length);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: with no dividends paid line, card 4.2 still draws, and its chart
 * shows a dash for every year rather than the no-dividend line.
 */
export const PayoutNoPaidLine: Story = {
	parameters: { companyGateway: noPaidLineGateway },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, PAYOUT);

		const expectedResult = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		const result = within(plot)
			.getAllByRole("listitem")
			.map((group) => within(group).queryAllByRole("button").length);

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
		const plot = await plotOf(canvasElement, PER_SHARE);

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

/** Play test: a company that paid no dividend shows one line in place of each chart. */
export const NoDividend: Story = {
	parameters: { companyGateway: noDividendGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const line = "The company paid no dividend in these fiscal years.";

		const expectedResult = [line, line];

		const result = (await canvas.findAllByText(/paid no dividend/)).map(
			(each) => each.textContent,
		);

		await expect(result).toEqual(expectedResult);
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
		const card = await cardOf(canvasElement, PER_SHARE);
		await within(card).findByRole("list", { name: "Fiscal years" });

		const expectedResult = null;

		const result = within(card).queryByText(/paid no dividend/);

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
		const card = await cardOf(canvasElement, PER_SHARE);

		const expectedResult =
			"The company paid no dividend in these fiscal years.";

		const result = await within(card).findByText(/paid no dividend/);

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
