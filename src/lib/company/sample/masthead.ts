import { Ticker } from "../../domain/ticker";
import type { MastheadSection, Period } from "../types";
import { dateInstant, periodId, yearEndInstant } from "./calendar";
import { meridianFinancials } from "./financials";
import { MERIDIAN, nasdaqPrices, reported } from "./sources";

/** The ticker under which the sample adapter serves Meridian. */
export const MERIDIAN_TICKER = Ticker.parse("MRDN");

// The P/E at each fiscal year end, FY2017 to FY2026, from the mock-up. The
// year-end price is this P/E times the diluted EPS of the year.
const PE_AT_YEAR_ENDS = [
	33.8, 41.6, 29.5, 52.4, 71.2, 64.0, 58.9, 45.7, 44.1, 38.9,
];

function price(key: string, label: string, value: number, period: Period) {
	return reported(
		{
			id: `masthead.${key}.${periodId(period)}`,
			label,
			value,
			unit: "usdPerShare",
			period,
		},
		nasdaqPrices,
		{ path: "Closing price, NASDAQ", xbrlTag: null },
	);
}

function pricesAtYearEnds(): MastheadSection["priceAtFiscalYearEnds"] {
	const income = meridianFinancials.income.annual;
	const netIncome = income.lines.find((line) => line.key === "netIncome");
	const shares = income.lines.find((line) => line.key === "dilutedShares");
	const periods = income.periods.map((period) =>
		yearEndInstant(period.fiscalYear),
	);
	const points = periods.map((period, position) => {
		const earnings = Number(netIncome?.points[position]?.value);
		const perShare = earnings / Number(shares?.points[position]?.value);
		const value = Math.round(PE_AT_YEAR_ENDS[position] * perShare * 100) / 100;
		return price(
			"priceAtFiscalYearEnds",
			"Price at fiscal year end",
			value,
			period,
		);
	});
	return {
		key: "priceAtFiscalYearEnds",
		label: "Price at fiscal year end",
		unit: "usdPerShare",
		periods,
		points,
	};
}

/**
 * The masthead of Meridian Semiconductor (MRDN): its listings, its sector and
 * the NASDAQ closing prices up to 23 Sep 2026.
 */
export const meridianMasthead: MastheadSection = {
	ticker: MERIDIAN_TICKER,
	name: MERIDIAN,
	listings: [
		{ exchange: "NASDAQ", symbol: "MRDN" },
		{ exchange: "XETRA", symbol: "MRD" },
		{ exchange: "BMV", symbol: "MRDN" },
	],
	sector: "Semiconductors",
	country: "United States",
	reportingCurrency: "USD",
	fiscalYearEnd: "Last Sunday of January",
	price: price("price", "Price", 210.6, dateInstant("2026-09-23")),
	priceMonthEarlier: price(
		"priceMonthEarlier",
		"Price a month earlier",
		202.3,
		dateInstant("2026-08-21"),
	),
	low52Weeks: price(
		"low52Weeks",
		"52-week low",
		142.3,
		dateInstant("2025-09-26"),
	),
	high52Weeks: price(
		"high52Weeks",
		"52-week high",
		238.9,
		dateInstant("2026-06-18"),
	),
	priceAtFiscalYearEnds: pricesAtYearEnds(),
};
