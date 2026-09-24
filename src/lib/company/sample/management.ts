import type {
	Claim,
	ManagementSection,
	PayYear,
	Person,
	Series,
} from "../types";
import {
	dateInstant,
	fiscalYearPeriod,
	periodId,
	printedDate,
	quarterEnd,
} from "./calendar";
import { INSIDER_NAMES, insiderHoldings } from "./holdings";
import { atLeastOne, derived, filing, proxy, reported } from "./sources";

const YEARS = Array.from({ length: 10 }, (_, position) => 2017 + position);

// The executives and directors from the 2026 proxy statement: the name, the
// role, the year they joined the board or became an officer, and whether the
// board finds the director independent. An officer who is not a director has
// no independence finding.
const PEOPLE: [string, string, number, boolean | null][] = [
	["Elena Marsh", "President, CEO and director", 1993, false],
	["Robert Chen-Hale", "Lead independent director", 2007, true],
	["Miriam Holt", "Director · chairs compensation committee", 2014, true],
	["Grace Adeyemi", "Director · chairs audit committee", 2018, true],
	["Samuel Ortega", "Director", 2020, true],
	["Ingrid Solberg", "Director", 2022, true],
	["Kenji Watanabe", "Director", 2024, true],
	["Tomas Lindqvist", "EVP, Operations", 2015, null],
	["Priya Raman", "EVP and CFO", 2021, null],
];

function people(): Person[] {
	const document = proxy(2026);
	return PEOPLE.map(([name, role, since, independent], row) => {
		const isDirector = independent !== null;
		const place = isDirector
			? `Directors › ${name}`
			: `Executive officers › ${name}`;
		return {
			name,
			role,
			isDirector,
			since: reported(
				{
					id: `management.people.${row}.since`,
					label: `${name}, ${isDirector ? "director" : "officer"} since`,
					value: since,
					unit: "year",
					period: null,
				},
				document,
				{
					path: `${place} › ${isDirector ? "Director" : "Officer"} since`,
					xbrlTag: null,
				},
			),
			independence: isDirector
				? reported(
						{
							id: `management.people.${row}.independence`,
							label: `Independence of ${name}`,
							value: independent ? "Independent" : "Not independent",
							unit: "text",
							period: null,
						},
						document,
						{ path: `${place} › Independence`, xbrlTag: null },
					)
				: null,
		};
	});
}

// The pay of the chief executive in millions of USD, FY2017 to FY2026, from
// the summary compensation table of each year's proxy statement.
const PAY: Record<Exclude<keyof PayYear, "fiscalYear">, [string, number[]]> = {
	salary: ["Salary", [0.99, 0.99, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.5, 1.5]],
	bonus: [
		"Non-equity incentive plan compensation",
		[2.4, 2.9, 0.0, 2.0, 3.2, 4.0, 0.0, 4.0, 6.0, 6.0],
	],
	stockAwards: [
		"Stock awards",
		[10.0, 11.5, 8.0, 15.3, 14.0, 19.8, 19.5, 21.4, 26.7, 31.2],
	],
	other: [
		"All other compensation",
		[0.02, 0.03, 0.04, 0.03, 0.04, 0.05, 0.05, 0.06, 0.08, 0.09],
	],
};

/**
 * The pay of the chief executive in each fiscal year. The proxy statement of
 * a year reports the fiscal year that ended in January of that year.
 */
function ceoPay(): PayYear[] {
	return YEARS.map((year, position) => {
		const period = fiscalYearPeriod(year);
		const figure = (key: keyof typeof PAY) =>
			reported(
				{
					id: `management.ceoPay.${key}.${periodId(period)}`,
					label: `CEO ${PAY[key][0].toLowerCase()}`,
					value: Math.round(PAY[key][1][position] * 1_000_000),
					unit: "usd",
					period,
				},
				proxy(year),
				{
					path: `Summary compensation table › Elena Marsh › ${PAY[key][0]}`,
					xbrlTag: null,
				},
			);
		return {
			fiscalYear: year,
			salary: figure("salary"),
			bonus: figure("bonus"),
			stockAwards: figure("stockAwards"),
			other: figure("other"),
		};
	});
}

// The shares in millions that officers and directors bought in each fiscal
// year, the net shares they bought (sold when below zero), and the number of
// Form 4 filings with a trade. Three filings of each year report purchases,
// and the rest report sales.
const BOUGHT = [0.4, 0.3, 1.8, 0.2, 0.3, 0.1, 2.4, 0.2, 0.1, 0.3];
const NET = [-4.1, -6.3, 0.6, -3.8, -5.5, -9.2, 1.1, -12.6, -18.9, -21.3];
const TRADE_FILINGS = [18, 20, 19, 22, 21, 24, 23, 27, 38, 30];
const PURCHASE_FILINGS = [2, 7, 12];
const DAY = 24 * 60 * 60 * 1000;

interface Trade {
	readonly filedOn: string;
	readonly insider: number;
	readonly purchase: boolean;
	readonly sequence: number;
}

/** The Form 4 filings with a trade in a fiscal year, spread evenly over the year. */
function trades(position: number): Trade[] {
	const year = YEARS[position];
	const start = Date.parse(quarterEnd({ year: year - 1, quarter: 4 })) + DAY;
	const days = (Date.parse(quarterEnd({ year, quarter: 4 })) - start) / DAY;
	const count = TRADE_FILINGS[position];
	return Array.from({ length: count }, (_, k) => ({
		filedOn: new Date(start + Math.floor(((k + 0.5) * days) / count) * DAY)
			.toISOString()
			.slice(0, 10),
		insider: k % INSIDER_NAMES.length,
		purchase: PURCHASE_FILINGS.includes(k),
		sequence: 1000 + position * 100 + k,
	}));
}

/**
 * The shares that officers and directors bought or sold in each fiscal year:
 * the sum of the shares of each Form 4 trade. The total splits evenly across
 * the filings, and the first filing takes the remainder.
 */
function insiderTrades(side: "bought" | "sold"): Series {
	const key = side === "bought" ? "insiderSharesBought" : "insiderSharesSold";
	const label = `Shares ${side} by insiders`;
	const periods = YEARS.map(fiscalYearPeriod);
	const points = periods.map((period, position): Claim => {
		const millions =
			side === "bought" ? BOUGHT[position] : BOUGHT[position] - NET[position];
		const total = Math.round(millions * 10) * 100_000;
		const own = trades(position).filter(
			(trade) => trade.purchase === (side === "bought"),
		);
		const each = Math.floor(total / own.length);
		const inputs = own.map(({ filedOn, insider, sequence }, row) =>
			reported(
				{
					id: `management.${key}.${periodId(period)}.trades.${row}`,
					label: `Shares ${side} by ${INSIDER_NAMES[insider]}`,
					value: row === 0 ? total - each * (own.length - 1) : each,
					unit: "shares",
					period: dateInstant(filedOn),
				},
				filing(
					"Form 4",
					`000700${String(insider + 1).padStart(4, "0")}-${filedOn.slice(2, 4)}-${String(sequence).padStart(6, "0")}`,
					filedOn,
					printedDate(filedOn),
					INSIDER_NAMES[insider],
				),
				{
					path:
						side === "bought"
							? "Table I › Amount of securities acquired (code P)"
							: "Table I › Amount of securities disposed of (code S)",
					xbrlTag: null,
				},
			),
		);
		// The inputs are trades on many dates. The column of the series fixes the
		// period of the sum, as it does for a derived quarter.
		return derived(
			{
				id: `management.${key}.${periodId(period)}`,
				label,
				value: total,
				unit: "shares",
				period,
			},
			`Sum of the shares ${side} in the ${own.length} Form 4 filings of FY${period.fiscalYear} with code ${side === "bought" ? "P" : "S"}`,
			atLeastOne(inputs, `the Form 4 trades of FY${period.fiscalYear}`),
		);
	});
	return { key, label, unit: "shares", periods, points };
}

/**
 * The Management data of Meridian: the executives and directors from the 2026
 * proxy statement, the pay of the chief executive from FY2017 to FY2026, the
 * insider holdings, and the shares that insiders bought and sold in each
 * fiscal year. The insiders hold the rows of the Relationships copy, under
 * this section's ids.
 */
export const meridianManagement: ManagementSection = {
	people: people(),
	ceoPay: ceoPay(),
	insiders: insiderHoldings("management"),
	insiderSharesBought: insiderTrades("bought"),
	insiderSharesSold: insiderTrades("sold"),
};
