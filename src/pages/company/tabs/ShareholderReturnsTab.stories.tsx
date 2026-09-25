import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import type { Figure, LineKey } from "../../../lib/company/types";
import { Ticker } from "../../../lib/domain/ticker";
import { BAR_TARGETS_OK, barTargetsOf } from "../../../test/barTargets";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import {
	fakeCompanyReport,
	fakeMasthead,
} from "../../../test/fixtures/companies/fake-company-report";
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

/**
 * A gateway whose FY2020 diluted shares, the fifth year, hold the FY2019
 * claim, so the line is out of step with its columns.
 */
const sharesOutOfStepGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () => {
		const { financials } = fakeCompanyReport;
		const annual = financials.income.annual;
		const lines = annual.lines.map((line) =>
			line.key === "dilutedShares"
				? {
						...line,
						points: line.points.map((point, index) =>
							index === 4 ? (line.points[3] ?? null) : point,
						),
					}
				: line,
		);
		const income = { ...financials.income, annual: { ...annual, lines } };
		return { ...financials, income };
	},
};

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
const BUYBACKS = "4.3 Buybacks Net of Shares Issued to Staff";
const SHARE_COUNT = "4.4 Share Count Over Ten Years";
const YIELD = "4.5 Total Shareholder Yield";

const repurchases = fakeCompanyReport.financials.cashFlow.annual.lines.find(
	({ key }) => key === "shareRepurchases",
)?.points;

/**
 * A gateway whose proceeds from stock plans in FY2022 are three times its
 * share repurchases, so the net buyback yield of FY2022 is below zero.
 */
const negativeYieldGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () =>
		financialsWith("shareIssuanceProceeds", (point, index) =>
			index === 6 && point
				? { ...point, value: Number(repurchases?.[6]?.value) * 3 }
				: point,
		),
};

/** A gateway with no FY2020 price at fiscal year end, so FY2020 has no yield. */
const missingPriceGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getMasthead: async (ticker) => {
		const masthead = fakeMasthead(ticker);
		const series = masthead.priceAtFiscalYearEnds;
		const points = series.points.map((point, index) =>
			index === 4 ? null : point,
		);
		return { ...masthead, priceAtFiscalYearEnds: { ...series, points } };
	},
};

/**
 * A gateway with no FY2020 shares issued to staff, and as many shares issued
 * as bought back in FY2021, so FY2021 nets to zero.
 */
const buybackGapGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getShareholderReturns: async () => {
		const returns = fakeCompanyReport.shareholderReturns;
		const bought = returns.sharesRepurchased.points;
		const series = returns.sharesIssuedToStaff;
		const points = series.points.map((point, index) =>
			index === 4 ? null : index === 5 ? (bought[5] ?? null) : point,
		);
		return { ...returns, sharesIssuedToStaff: { ...series, points } };
	},
};

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
 * cash flow. On a phone the two cards stack, 4.1 first. Card 4.3 takes both
 * columns below them and draws the shares bought back, the shares issued to
 * staff and the net buyback. Cards 4.4 and 4.5 sit side by side below it on
 * a desktop: the diluted shares, and the dividend yield and net buyback
 * yield stacked, each at the market cap of the fiscal year end. The sources
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

		const expectedResult = [PER_SHARE, PAYOUT, BUYBACKS, SHARE_COUNT, YIELD];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: when the masthead does not load, cards 4.1 to 4.4 still draw,
 * and card 4.5, which needs the year-end prices, is left out.
 */
export const MastheadFailed: Story = {
	parameters: {
		companyGateway: {
			...alwaysFoundCompanyGateway(),
			getMasthead: failingGateway.getMasthead,
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [PER_SHARE, PAYOUT, BUYBACKS, SHARE_COUNT];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: the caption of card 4.5 names the daily prices beside the 10-K
 * filings, since the market cap of each year reads the year-end price.
 */
export const YieldCaption: Story = {
	play: async ({ canvasElement }) => {
		const card = await cardOf(canvasElement, YIELD);

		const expectedResult = true;

		const result = /10-K filings and daily prices/.test(card.textContent ?? "");

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: on a desktop, cards 4.4 and 4.5 sit side by side, and every bar
 * of both has a tap target at least 24 px wide and tall inside the plot.
 */
export const LastRowOnDesktop: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const plots = [
			await plotOf(canvasElement, SHARE_COUNT),
			await plotOf(canvasElement, YIELD),
		];
		const tops = await Promise.all(
			[SHARE_COUNT, YIELD].map(
				async (title) =>
					(await cardOf(canvasElement, title)).getBoundingClientRect().top,
			),
		);

		const expectedResult = {
			sideBySide: true,
			targets: [BAR_TARGETS_OK, BAR_TARGETS_OK],
		};

		const result = {
			sideBySide: tops[0] === tops[1],
			targets: plots.map(barTargetsOf),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: at 320 px, every bar of cards 4.1 to 4.5 has a tap target at
 * least 24 px wide and tall inside the plot, every bar draws, and each chart
 * scrolls inside its card, so the page does not scroll sideways.
 */
export const LoadedOnPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const plots = [
			await plotOf(canvasElement, PER_SHARE),
			await plotOf(canvasElement, PAYOUT),
			await plotOf(canvasElement, BUYBACKS),
			await plotOf(canvasElement, SHARE_COUNT),
			await plotOf(canvasElement, YIELD),
		];

		const expectedResult = Array(5).fill(BAR_TARGETS_OK);

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

/** Play test: the "Data" table of card 4.4 shows the diluted shares its chart draws, year by year. */
export const ShareCountDataTable: Story = { play: dataTableOf(SHARE_COUNT) };

/**
 * Returns the play test that checks the "Data" table of the card titled
 * `title`, a row for each year, against every bar of its chart.
 */
function rowsTableOf(title: string): Story["play"] {
	return async ({ canvasElement }) => {
		const card = within(await cardOf(canvasElement, title));
		const plot = await card.findByRole("list", { name: "Fiscal years" });

		const expectedResult = within(plot)
			.getAllByRole("listitem")
			.map((group) =>
				[...group.children]
					.slice(1)
					.map((bar) => bar.textContent?.replace(/^.*: /, "")),
			);

		await userEvent.click(card.getByRole("button", { name: "Data" }));
		const table = await card.findByRole("table", {
			name: `${title.replace(/^\d+\.\d+ /, "")} table`,
		});
		const result = within(table)
			.getAllByRole("row")
			.slice(1)
			.map((row) =>
				within(row)
					.getAllByRole("cell")
					.map((cell) => cell.textContent),
			);

		await expect(result).toEqual(expectedResult);
	};
}

/**
 * Play test: the "Data" table of card 4.3 shows, year by year, the three
 * figures its chart draws, the dimmed dash included.
 */
export const BuybacksDataTable: Story = {
	parameters: { companyGateway: buybackGapGateway },
	play: rowsTableOf(BUYBACKS),
};

/**
 * Play test: the "Data" table of card 4.5 shows, year by year, both yields
 * its chart stacks, the negative net buyback yield of FY2022 included.
 */
export const YieldDataTable: Story = {
	parameters: { companyGateway: negativeYieldGateway },
	play: rowsTableOf(YIELD),
};

/**
 * Play test: a negative net buyback yield in FY2022 draws below the zero
 * line, under the dividend yield of the same year, and still opens its
 * sources, at 320 px with every tap target inside the plot.
 */
export const NegativeYield: Story = {
	parameters: { companyGateway: negativeYieldGateway },
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, YIELD);
		const group = within(plot).getAllByRole("listitem")[6] as HTMLElement;
		const [dividend, net] = within(group)
			.getAllByRole("button")
			.map((bar) => bar.parentElement?.getBoundingClientRect());

		const expectedResult = {
			netIsNegative: true,
			netBelowDividend: true,
			targets: BAR_TARGETS_OK,
		};

		const result = {
			netIsNegative: /Net buyback yield: [−-]/.test(group.textContent ?? ""),
			netBelowDividend:
				(net?.height ?? 0) > 0 &&
				Math.abs((net?.top ?? 0) - (dividend?.bottom ?? -1)) < 0.5,
			targets: barTargetsOf(plot),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: with no FY2020 price at fiscal year end, card 4.5 draws no bar
 * for FY2020 but the dimmed dash, and every other year keeps both parts.
 */
export const YieldMissingYear: Story = {
	parameters: { companyGateway: missingPriceGateway },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, YIELD);

		const expectedResult = [2, 2, 2, 2, "—", 2, 2, 2, 2, 2];

		const result = within(plot)
			.getAllByRole("listitem")
			.map(
				(group) =>
					within(group).queryAllByRole("button").length ||
					group.textContent?.replace(/^FY\d+/, ""),
			);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: with no FY2020 shares issued to staff, card 4.3 draws a dash,
 * not a bar, for that side and for the net of FY2020.
 */
export const BuybacksMissingYear: Story = {
	parameters: { companyGateway: buybackGapGateway },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, BUYBACKS);

		const expectedResult = [3, 3, 3, 3, 1, 3, 3, 3, 3, 3];

		const result = within(plot)
			.getAllByRole("listitem")
			.map((group) => within(group).queryAllByRole("button").length);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: a net buyback of zero in FY2021 draws the 2 px mark, which opens
 * the sources of the net.
 */
export const BuybacksZeroNet: Story = {
	parameters: { companyGateway: buybackGapGateway },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, BUYBACKS);
		const group = within(plot).getAllByRole("listitem")[5] as HTMLElement;
		const bar = within(group).getByRole("button", { name: /^Net buyback/ });

		const expectedResult = { name: "Net buyback: 0", height: 2 };

		const result = {
			name: bar.textContent,
			height: bar.parentElement?.getBoundingClientRect().height,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: card 4.4 reads each point by its own fiscal year, so a point in
 * the wrong year's slot draws nothing there, never a bar for the wrong year.
 */
export const ShareCountOutOfStep: Story = {
	parameters: { companyGateway: sharesOutOfStepGateway },
	play: async ({ canvasElement }) => {
		const plot = await plotOf(canvasElement, SHARE_COUNT);

		const expectedResult = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1];

		const result = within(plot)
			.getAllByRole("listitem")
			.map((group) => within(group).queryAllByRole("button").length);

		await expect(result).toEqual(expectedResult);
	},
};

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
