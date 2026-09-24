import type {
	Filing,
	FinancialsSection,
	LineKey,
	Nullable,
	Period,
	StatementLine,
	StatementTable,
} from "../types";
import {
	type FiscalQuarter,
	fiscalQuarterPeriod,
	fiscalYearPeriod,
	periodId,
	previousQuarter,
	quarterEnd,
	quarterEndInstant,
	yearEndInstant,
	yearToDatePeriod,
} from "./calendar";
import { type StatementKey, statementLines } from "./lines";
import {
	MissingSampleData,
	meridianFilings,
	reported,
	tenK,
	tenQ,
} from "./sources";

// ---- The windows: the latest period that a filing covers ----

function latest(form: Filing["form"]): Filing {
	const found = meridianFilings.filter((each) => each.form === form).at(-1);
	if (found === undefined) {
		throw new MissingSampleData(`the latest ${form}`);
	}
	return found;
}

function label({ year, quarter }: FiscalQuarter): string {
	return `Q${quarter} FY${year}`;
}

const LATEST_YEAR = Number(latest("10-K").periodLabel.slice(2));
const LATEST_TEN_Q = latest("10-Q").periodLabel;
const LATEST_QUARTER: FiscalQuarter = [
	{ year: LATEST_YEAR, quarter: 4 },
	{ year: Number(LATEST_TEN_Q.slice(5)), quarter: Number(LATEST_TEN_Q[1]) },
].reduce((later, each) =>
	quarterEnd(each) > quarterEnd(later) ? each : later,
);

/** The ten fiscal years of the annual tables, oldest first. */
const YEARS = Array.from(
	{ length: 10 },
	(_, position) => LATEST_YEAR - 9 + position,
);

/** The eight quarters of the quarterly tables, oldest first. */
const QUARTERS = Array.from({ length: 7 }).reduce<FiscalQuarter[]>(
	(quarters) => [previousQuarter(quarters[0]), ...quarters],
	[LATEST_QUARTER],
);

/** The quarters with a six-month or nine-month figure, oldest first. */
const YEAR_TO_DATE = QUARTERS.flatMap((at) =>
	at.quarter === 3 ? [previousQuarter(at), at] : at.quarter === 2 ? [at] : [],
).filter(
	(at, position, all) =>
		all.findIndex((each) => label(each) === label(at)) === position,
);

// ---- The figures, in billions of USD unless the name says otherwise ----

type Year = number;
type Values = Record<Year, number>;

function byYear(values: readonly number[]): Values {
	return Object.fromEntries(
		YEARS.map((year, position) => [year, values[position]]),
	);
}

const REVENUE = byYear([
	6.9, 9.7, 11.7, 10.9, 16.7, 26.9, 27.0, 60.9, 130.5, 212.0,
]);
const GROSS_MARGIN_PERCENT = byYear([
	58.8, 59.9, 61.2, 62.0, 62.3, 64.9, 56.9, 72.7, 75.0, 74.7,
]);
const RESEARCH = byYear([1.5, 1.8, 2.4, 2.8, 3.9, 5.3, 7.3, 8.7, 12.9, 17.6]);
const SELLING = byYear([0.7, 0.8, 1.0, 1.1, 1.9, 2.2, 2.4, 2.7, 3.5, 4.4]);
const OPERATING_INCOME = byYear(
	YEARS.map(
		(year) =>
			(REVENUE[year] * GROSS_MARGIN_PERCENT[year]) / 100 -
			RESEARCH[year] -
			SELLING[year],
	),
);
const NET_INCOME = byYear([
	1.7, 3.0, 3.5, 2.8, 4.3, 9.8, 4.4, 29.8, 72.9, 135.1,
]);
const FREE_CASH_FLOW = byYear([
	1.5, 2.9, 3.1, 4.3, 4.7, 8.1, 3.8, 27.0, 60.9, 118.0,
]);
const CAPITAL_EXPENDITURE = byYear([
	0.2, 0.6, 0.6, 0.5, 1.1, 1.0, 1.8, 1.1, 3.2, 4.9,
]);
/** Diluted shares, in billions. */
const DILUTED_SHARES = byYear([
	25.1, 25.5, 25.4, 24.8, 25.0, 25.4, 25.1, 24.9, 24.8, 24.5,
]);
// The dividend per share in USD. The mock-up series is ten times this. At the
// mock-up scale, the dividends of FY2023 exceed its free cash flow.
const DIVIDEND_PER_SHARE = byYear([
	0.005, 0.006, 0.008, 0.01, 0.016, 0.016, 0.016, 0.016, 0.018, 0.02,
]);
const REPURCHASES = byYear([
	0.9, 0.0, 1.6, 2.4, 0.0, 0.0, 10.0, 9.5, 33.7, 55.0,
]);
const STOCK_BASED_PAY = byYear([
	0.5, 0.6, 0.8, 0.9, 1.4, 2.0, 2.7, 3.5, 7.1, 12.9,
]);
const STOCK_PLAN_PROCEEDS = byYear([
	0.2, 0.3, 0.3, 0.2, 0.4, 0.3, 0.4, 0.4, 0.5, 0.6,
]);

type BalancePart =
	| "equity"
	| "netCash"
	| "longTermDebt"
	| "shortTermDebt"
	| "currentAssets"
	| "currentLiabilities"
	| "liabilities";
type BalanceKey = Exclude<
	LineKey,
	| "revenue"
	| "operatingIncome"
	| "netIncome"
	| "dilutedEps"
	| "dilutedShares"
	| "operatingCashFlow"
	| "capitalExpenditure"
	| "dividendsPaid"
	| "shareRepurchases"
	| "shareIssuanceProceeds"
	| "shareBasedCompensation"
>;

/**
 * Builds the eight balance sheet lines from their parts. Total assets are
 * liabilities plus equity, so the balance sheet always balances. Cash is net
 * cash plus the long-term and short-term debt.
 */
function balanceSheet<T>(
	parts: Record<BalancePart, number[]>,
	by: (values: number[]) => T,
): Record<BalanceKey, T> {
	const sum = (first: number[], ...others: number[][]) =>
		first.map((value, position) =>
			others.reduce((total, other) => total + other[position], value),
		);
	return {
		totalCurrentAssets: by(parts.currentAssets),
		totalAssets: by(sum(parts.liabilities, parts.equity)),
		totalCurrentLiabilities: by(parts.currentLiabilities),
		totalLiabilities: by(parts.liabilities),
		shareholdersEquity: by(parts.equity),
		cashAndShortTermInvestments: by(
			sum(parts.netCash, parts.longTermDebt, parts.shortTermDebt),
		),
		shortTermDebt: by(parts.shortTermDebt),
		longTermDebt: by(parts.longTermDebt),
	};
}

const ANNUAL: Record<LineKey, Values> = {
	revenue: REVENUE,
	operatingIncome: OPERATING_INCOME,
	netIncome: NET_INCOME,
	dilutedShares: DILUTED_SHARES,
	dilutedEps: byYear(
		YEARS.map((year) => NET_INCOME[year] / DILUTED_SHARES[year]),
	),
	operatingCashFlow: byYear(
		YEARS.map((year) => FREE_CASH_FLOW[year] + CAPITAL_EXPENDITURE[year]),
	),
	capitalExpenditure: CAPITAL_EXPENDITURE,
	dividendsPaid: byYear(
		YEARS.map((year) => DIVIDEND_PER_SHARE[year] * DILUTED_SHARES[year]),
	),
	shareRepurchases: REPURCHASES,
	shareIssuanceProceeds: STOCK_PLAN_PROCEEDS,
	shareBasedCompensation: STOCK_BASED_PAY,
	...balanceSheet(
		{
			equity: [6.0, 7.5, 9.3, 12.2, 16.9, 26.6, 22.1, 43.0, 79.3, 157.3],
			netCash: [3.0, 5.0, 7.9, 6.2, 8.8, 9.6, 3.5, 15.0, 34.8, 51.0],
			longTermDebt: [2.0, 2.0, 2.0, 2.0, 7.0, 11.0, 9.7, 8.5, 8.5, 8.5],
			shortTermDebt: [0, 0, 0, 0, 0, 0, 1.3, 1.3, 0, 0],
			currentAssets: [
				7.0, 9.3, 12.4, 13.7, 19.5, 28.8, 23.1, 36.9, 60.0, 115.0,
			],
			currentLiabilities: [1.2, 1.3, 1.5, 1.8, 3.9, 4.3, 6.6, 10.6, 18.0, 28.0],
			liabilities: [3.5, 3.9, 4.2, 5.1, 11.9, 17.6, 19.1, 22.8, 32.3, 42.0],
		},
		byYear,
	),
};

// The revenue of each reported quarter. The other flow lines of a quarter
// take the same share of their fiscal year as its revenue, except where
// QUARTER_OVERRIDES names a figure.
const QUARTER_REVENUE: Record<string, number> = {
	"Q1 FY2025": 26.0,
	"Q2 FY2025": 30.0,
	"Q3 FY2025": 35.1,
	"Q1 FY2026": 44.1,
	"Q2 FY2026": 46.7,
	"Q3 FY2026": 57.0,
	"Q1 FY2027": 68.0,
	"Q2 FY2027": 72.5,
};

// Figures of a quarter that do not follow its revenue share. Share counts are
// averages, so each quarter reports its own count.
const QUARTER_OVERRIDES: Record<string, Partial<Record<LineKey, number>>> = {
	"Q1 FY2025": { dilutedShares: 24.9 },
	"Q2 FY2025": { dilutedShares: 24.9 },
	"Q3 FY2025": { dilutedShares: 24.8 },
	"Q1 FY2026": {
		dilutedShares: 24.6,
		shareRepurchases: 12.0,
		shareBasedCompensation: 2.9,
	},
	"Q2 FY2026": {
		dilutedShares: 24.5,
		shareRepurchases: 13.0,
		shareBasedCompensation: 3.1,
	},
	"Q3 FY2026": {
		dilutedShares: 24.5,
		shareRepurchases: 14.0,
		shareBasedCompensation: 3.3,
	},
	"Q1 FY2027": {
		dilutedShares: 24.5,
		shareRepurchases: 14.5,
		shareBasedCompensation: 3.5,
	},
	"Q2 FY2027": {
		dilutedShares: 24.5,
		shareRepurchases: 15.8,
		shareBasedCompensation: 3.7,
	},
};

// The balance sheet at each quarter end that is not a fiscal year end.
const QUARTER_BALANCE = balanceSheet(
	{
		equity: [65.9, 97.8, 116.2, 136.4, 165.0, 180.0],
		netCash: [30.0, 45.2, 48.3, 52.1, 49.5, 54.0],
		longTermDebt: [8.5, 8.5, 8.5, 8.5, 8.5, 8.5],
		shortTermDebt: [0, 0, 0, 0, 0, 0],
		currentAssets: [67.6, 76.9, 85.3, 101.0, 125.4, 138.6],
		currentLiabilities: [15.8, 20.0, 22.4, 25.6, 29.0, 31.5],
		liabilities: [30.1, 34.9, 37.9, 40.4, 44.4, 48.8],
	},
	(values: number[]) =>
		Object.fromEntries(
			[
				"Q3 FY2025",
				"Q1 FY2026",
				"Q2 FY2026",
				"Q3 FY2026",
				"Q1 FY2027",
				"Q2 FY2027",
			].map((label, position) => [label, values[position]]),
		),
);

/** The figure of a flow line or a share count for three months. */
function quarterFigure(key: LineKey, at: FiscalQuarter): number {
	const override = QUARTER_OVERRIDES[label(at)][key];
	if (override !== undefined) {
		return override;
	}
	if (key === "dilutedEps") {
		return quarterFigure("netIncome", at) / quarterFigure("dilutedShares", at);
	}
	// A quarter of FY2027 takes its share of the FY2026 figure.
	const year = Math.min(at.year, LATEST_YEAR);
	return (ANNUAL[key][year] * QUARTER_REVENUE[label(at)]) / REVENUE[year];
}

/** The figure of a flow line from the start of the fiscal year to the end of `at`. */
function yearToDateFigure(key: LineKey, at: FiscalQuarter): number {
	const quarters = [1, 2, 3]
		.filter((quarter) => quarter <= at.quarter)
		.map((quarter) => ({ year: at.year, quarter }));
	if (key === "dilutedEps") {
		return (
			yearToDateFigure("netIncome", at) / yearToDateFigure("dilutedShares", at)
		);
	}
	// A share count is an average over the period, not a sum.
	const share = key === "dilutedShares" ? 1 / quarters.length : 1;
	return quarters.reduce(
		(sum, quarter) =>
			sum + (wholeUnits(key, quarterFigure(key, quarter)) / 1e9) * share,
		0,
	);
}

/**
 * Turns billions into whole units, rounded to the nearest million: $1M for a
 * USD figure and one million shares for a share count. It rounds a per-share
 * figure to the cent.
 */
function wholeUnits(key: LineKey, billions: number): number {
	return statementLines[key].unit === "usdPerShare"
		? Math.round(billions * 100) / 100
		: Math.round(billions * 1000) * 1_000_000;
}

// ---- The tables ----

interface Column {
	readonly period: Period;
	readonly document: Filing;
	readonly figure: (key: LineKey) => Nullable<number>;
}

function table(statement: StatementKey, columns: Column[]): StatementTable {
	const periods = columns.map((column) => column.period);
	const keys = (Object.keys(statementLines) as LineKey[]).filter(
		(key) => statementLines[key].statement === statement,
	);
	const lines = keys.map((key): StatementLine => {
		const record = statementLines[key];
		const points = columns.map(({ period, document, figure }) => {
			const value = figure(key);
			return value === null
				? null
				: reported(
						{
							id: `financials.${key}.${periodId(period)}`,
							label: record.label,
							value: wholeUnits(key, value),
							unit: record.unit,
							period,
						},
						document,
						record,
					);
		});
		return {
			key,
			label: record.label,
			unit: record.unit,
			level: record.level,
			periods,
			points,
		};
	});
	return { periods, lines };
}

function annualTable(statement: StatementKey): StatementTable {
	return table(
		statement,
		YEARS.map((year) => ({
			period:
				statement === "balance" ? yearEndInstant(year) : fiscalYearPeriod(year),
			document: tenK(year),
			figure: (key) => ANNUAL[key][year],
		})),
	);
}

/**
 * The quarterly table. A 10-Q reports no fourth quarter, and its cash flow
 * statement reports a year to date. So the income statement has a `null`
 * point at each fourth quarter, and the cash flow statement has one at each
 * second, third and fourth quarter.
 */
function quarterlyTable(statement: StatementKey): StatementTable {
	return table(
		statement,
		QUARTERS.map((at) => ({
			period:
				statement === "balance"
					? quarterEndInstant(at)
					: fiscalQuarterPeriod(at),
			document: at.quarter === 4 ? tenK(at.year) : tenQ(at),
			figure: (key) => {
				if (statement === "balance") {
					return at.quarter === 4
						? ANNUAL[key][at.year]
						: QUARTER_BALANCE[key as BalanceKey][label(at)];
				}
				const reportedByTenQ =
					statement === "income" ? at.quarter < 4 : at.quarter === 1;
				return reportedByTenQ ? quarterFigure(key, at) : null;
			},
		})),
	);
}

/**
 * The six-month and nine-month table. A 10-Q reports these figures for the
 * income statement and the cash flow statement. `completeQuarters` derives
 * each fourth quarter as the fiscal year minus the nine-month figure. So it
 * also derives Q4 FY2025, whose first two quarters lie before the quarterly
 * window.
 */
function yearToDateTable(statement: StatementKey): StatementTable {
	return table(
		statement,
		YEAR_TO_DATE.map((at) => ({
			period: yearToDatePeriod(at),
			document: tenQ(at),
			figure: (key) => yearToDateFigure(key, at),
		})),
	);
}

/**
 * The three statements of Meridian (MRDN). The annual tables hold FY2017 to
 * FY2026, and the quarterly tables hold Q3 FY2025 to Q2 FY2027, because the
 * 10-Q for Q2 FY2027 is the latest filing. The income statement and the cash
 * flow statement also have a year-to-date table.
 */
export const meridianFinancials: FinancialsSection = {
	income: {
		annual: annualTable("income"),
		quarterly: quarterlyTable("income"),
		yearToDate: yearToDateTable("income"),
	},
	balance: {
		annual: annualTable("balance"),
		quarterly: quarterlyTable("balance"),
		yearToDate: null,
	},
	cashFlow: {
		annual: annualTable("cashFlow"),
		quarterly: quarterlyTable("cashFlow"),
		yearToDate: yearToDateTable("cashFlow"),
	},
};
