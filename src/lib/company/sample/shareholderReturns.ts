import type {
	Claim,
	LineKey,
	Series,
	ShareholderReturnsSection,
	Unit,
} from "../types";
import { dateInstant, fiscalYearPeriod, periodId } from "./calendar";
import { DIVIDENDS_PER_SHARE, meridianFinancials } from "./financials";
import { meridianMasthead } from "./masthead";
import { MissingSampleData, filing, reported, tenK } from "./sources";

const YEARS = meridianFinancials.cashFlow.annual.periods.map(
	(period) => period.fiscalYear,
);

// The shares issued under staff plans in each fiscal year, in millions: stock
// units that vested and options that staff exercised. From FY2018 to FY2026,
// the shares issued less the shares bought back equal the fall in diluted
// shares from FY2017 to FY2026, 600M shares.
const SHARES_ISSUED_TO_STAFF = [
	240, 420, 260, 230, 190, 180, 200, 120, 100, 88,
];

function cashFlowLine(key: LineKey): Series {
	const line = meridianFinancials.cashFlow.annual.lines.find(
		(each) => each.key === key,
	);
	if (line === undefined) {
		throw new MissingSampleData(`the annual ${key} line`);
	}
	return line;
}

/**
 * The average price at which Meridian bought back shares in a fiscal year:
 * the mean of the closing prices at the fiscal year ends before and after it.
 * FY2017 has no earlier year-end price in the sample, so it takes its own.
 */
function averageRepurchasePrice(position: number): number {
	const prices = meridianMasthead.priceAtFiscalYearEnds.points
		.slice(Math.max(position - 1, 0), position + 1)
		.map((point) => Number(point?.value));
	return prices.reduce((total, price) => total + price, 0) / prices.length;
}

// The shares bought back in each fiscal year, in millions: the repurchases of
// the cash flow statement at the average price of the year.
const SHARES_REPURCHASED = cashFlowLine("shareRepurchases").points.map(
	(point, position) =>
		Math.round(
			Number(point?.value) / averageRepurchasePrice(position) / 1_000_000,
		),
);

function series(
	key: keyof ShareholderReturnsSection,
	label: string,
	unit: Unit,
	values: readonly number[],
	path: string,
	xbrlTag: string,
): Series {
	const periods = YEARS.map(fiscalYearPeriod);
	const points = periods.map(
		(period, position): Claim =>
			reported(
				{
					id: `shareholderReturns.${key}.${periodId(period)}`,
					label,
					value: values[position],
					unit,
					period,
				},
				tenK(period.fiscalYear),
				{ path, xbrlTag },
			),
	);
	return { key, label, unit, periods, points };
}

const EQUITY_STATEMENT = "Consolidated statements of shareholders' equity";

/**
 * The Shareholder returns data of Meridian: the dividend per share of each
 * fiscal year, the quarterly dividend declared on 28 May 2026, and the shares
 * bought back and issued to staff in each fiscal year.
 */
export const meridianShareholderReturns: ShareholderReturnsSection = {
	dividendPerShare: series(
		"dividendPerShare",
		"Dividend per share",
		"usdPerShare",
		DIVIDENDS_PER_SHARE,
		"Notes › Capital return program › Cash dividends declared per common share",
		"us-gaap:CommonStockDividendsPerShareDeclared",
	),
	latestDividendDeclared: reported(
		{
			id: "shareholderReturns.latestDividendDeclared.2026-05-28",
			label: "Latest dividend declared, per share",
			value: 0.005,
			unit: "usdPerShare",
			period: dateInstant("2026-05-28"),
		},
		filing("8-K", "0001234567-26-000026", "2026-05-28", "28 May 2026"),
		{ path: "Item 8.01 › Quarterly cash dividend per share", xbrlTag: null },
	),
	sharesRepurchased: series(
		"sharesRepurchased",
		"Shares bought back",
		"shares",
		SHARES_REPURCHASED.map((millions) => millions * 1_000_000),
		`${EQUITY_STATEMENT} › Repurchases of common stock, shares`,
		"us-gaap:StockRepurchasedDuringPeriodShares",
	),
	sharesIssuedToStaff: series(
		"sharesIssuedToStaff",
		"Shares issued to staff",
		"shares",
		SHARES_ISSUED_TO_STAFF.map((millions) => millions * 1_000_000),
		`${EQUITY_STATEMENT} › Common stock issued under employee stock plans, shares`,
		"us-gaap:StockIssuedDuringPeriodSharesShareBasedCompensation",
	),
};
