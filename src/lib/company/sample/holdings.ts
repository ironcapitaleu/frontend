import type { Claim, OwnershipSummary } from "../types";
import { dateInstant, printedDate } from "./calendar";
import { atLeastOne, derived, filing, reported, tenQ } from "./sources";

function sum(claims: readonly Claim[]): number {
	return claims.reduce((total, claim) => total + Number(claim.value), 0);
}

// The six largest funds from the mock-up, in billions of shares at 30 Jun
// 2026. 32 smaller funds hold the rest of the 16.10B shares of all 38 filers.
const LARGEST_FUNDS: [string, number][] = [
	["Harbor Point Index Funds", 2.13],
	["Northfield Asset Management", 1.84],
	["Granite Bay Advisors", 0.98],
	["Larkspur Capital", 0.95],
	["Oakmont Trust Company", 0.55],
	["Eastline Investors", 0.44],
];
const INSTITUTION_SHARES = 16.1;

/** One fund row: its name and its shares in billions at 30 Jun 2026. */
type Fund = [string, number];

function funds(): Fund[] {
	const smaller = Array.from(
		{ length: 31 },
		(_, row): Fund => [`Fund ${row + 7}`, 0.43 - 0.009 * row],
	);
	const listed: Fund[] = [...LARGEST_FUNDS, ...smaller];
	const rest =
		INSTITUTION_SHARES -
		listed.reduce((total, [, shares]) => total + shares, 0);
	return [...listed, ["Fund 38", rest]];
}

/** The quarter end that the 13F totals cover. */
export const OWNERSHIP_DATE = dateInstant("2026-06-30");

/** The shares of each 13F filer at 30 Jun 2026, from its 13F-HR for Q2 2026. */
function fundShares(id: (row: number) => string): Claim[] {
	return funds().map(([fund, shares], row) =>
		reported(
			{
				id: id(row),
				label: `Shares held by ${fund}`,
				value: Math.round(shares * 1000) * 1_000_000,
				unit: "shares",
				period: OWNERSHIP_DATE,
			},
			filing(
				"13F-HR",
				`000800${String(row + 1).padStart(4, "0")}-26-000004`,
				"2026-08-14",
				"Q2 2026",
				fund,
			),
			{ path: "Information table › Shares (sshPrnamt)", xbrlTag: null },
		),
	);
}

// The officers and directors with their shares in millions, and the date of
// the latest Form 4 of each.
const INSIDERS: [string, number, string][] = [
	["Elena Marsh", 861.4, "2026-06-18"],
	["Robert Chen-Hale", 51.8, "2026-04-21"],
	["Tomas Lindqvist", 28.6, "2026-06-02"],
	["Miriam Holt", 12.3, "2026-03-14"],
	["Grace Adeyemi", 4.1, "2026-03-14"],
	["Priya Raman", 3.2, "2026-06-02"],
];

function insiderShares(id: (row: number) => string): Claim[] {
	return INSIDERS.map(([name, shares, filedOn], row) =>
		reported(
			{
				id: id(row),
				label: `Shares held by ${name}`,
				value: Math.round(shares * 10) * 100_000,
				unit: "shares",
				period: dateInstant(filedOn),
			},
			filing(
				"Form 4",
				`000700${String(row + 1).padStart(4, "0")}-26-000001`,
				filedOn,
				printedDate(filedOn),
				name,
			),
			{
				path: "Table I › Amount beneficially owned following reported transactions",
				xbrlTag: null,
			},
		),
	);
}

/**
 * The ownership summary at 30 Jun 2026. The Overview and Relationships
 * sections each get their own copy, from the same filings. The copies differ
 * in the section prefix of their claim ids only.
 */
export function ownershipSummary(
	section: "overview" | "relationships",
): OwnershipSummary {
	const prefix = `${section}.ownership`;
	const funds = fundShares((row) => `${prefix}.institutionShares.funds.${row}`);
	const insiders = insiderShares(
		(row) => `${prefix}.insiderShares.insiders.${row}`,
	);
	const institutionShares = derived(
		{
			id: `${prefix}.institutionShares`,
			label: "Shares held by institutions",
			value: sum(funds),
			unit: "shares",
			period: OWNERSHIP_DATE,
		},
		`Sum of the shares in the 13F-HR filings of ${funds.length} funds`,
		atLeastOne(funds, "the 13F-HR funds"),
	);
	return {
		asOf: OWNERSHIP_DATE.endsOn,
		sharesOutstanding: reported(
			{
				id: `${prefix}.sharesOutstanding.2026-08-21`,
				label: "Shares outstanding",
				value: 24_400_000_000,
				unit: "shares",
				period: dateInstant("2026-08-21"),
			},
			tenQ({ year: 2027, quarter: 2 }),
			{
				path: "Cover page › Shares outstanding",
				xbrlTag: "dei:EntityCommonStockSharesOutstanding",
			},
		),
		institutionShares,
		insiderShares: derived(
			{
				id: `${prefix}.insiderShares`,
				label: "Shares held by insiders",
				value: sum(insiders),
				unit: "shares",
				period: null,
			},
			"Sum of the shares of each officer and director, from the latest Form 4 of each",
			atLeastOne(insiders, "the Form 4 insiders"),
		),
	};
}
