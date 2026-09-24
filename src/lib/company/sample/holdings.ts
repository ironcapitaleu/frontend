import type {
	Claim,
	FundHolding,
	InsiderHolding,
	OwnershipSummary,
} from "../types";
import { dateInstant, printedDate } from "./calendar";
import { atLeastOne, derived, filing, reported, tenQ } from "./sources";

/** The section whose copy of a holding list a claim id names. */
type HoldingSection = "overview" | "relationships" | "management";

function sum(claims: readonly Claim[]): number {
	return claims.reduce((total, claim) => total + Number(claim.value), 0);
}

// The six largest funds from the mock-up, in billions of shares at 30 Jun
// 2026, with the change in percent against 31 Mar 2026. 32 smaller funds hold
// the rest of the 16.10B shares of all 38 filers.
const LARGEST_FUNDS: [string, number, number][] = [
	["Harbor Point Index Funds", 2.13, 1.2],
	["Northfield Asset Management", 1.84, 0.8],
	["Granite Bay Advisors", 0.98, -0.4],
	["Larkspur Capital", 0.95, 2.6],
	["Oakmont Trust Company", 0.55, 1.1],
	["Eastline Investors", 0.44, -3.9],
];
const INSTITUTION_SHARES = 16.1;

// Made-up names for funds 7 to 10, so the ten rows of card 5.1 all read as
// funds. The smaller funds past them keep numbered names.
const NEXT_FUNDS = [
	"Willowmere Partners",
	"Copper Ridge Capital",
	"Saltmarsh Asset Management",
	"Brightwater Holdings",
];

/**
 * One fund row: its name, its shares in billions at 30 Jun 2026, and its
 * change in percent against 31 Mar 2026. The change is `null` for Fund 38,
 * which first filed a 13F-HR for Q2 2026.
 */
type Fund = [string, number, number | null];

function funds(): Fund[] {
	const smaller = Array.from(
		{ length: 31 },
		(_, row): Fund => [
			NEXT_FUNDS[row] ?? `Fund ${row + 7}`,
			0.43 - 0.009 * row,
			(((row * 7) % 11) - 5) * 0.4,
		],
	);
	const listed: Fund[] = [...LARGEST_FUNDS, ...smaller];
	const rest =
		INSTITUTION_SHARES -
		listed.reduce((total, [, shares]) => total + shares, 0);
	return [...listed, ["Fund 38", rest, null]];
}

/** The quarter end that the 13F totals cover. */
export const OWNERSHIP_DATE = dateInstant("2026-06-30");
const QUARTER_EARLIER = dateInstant("2026-03-31");

function fundFiling(fund: string, row: number, quarter: 1 | 2) {
	return filing(
		"13F-HR",
		`000800${String(row + 1).padStart(4, "0")}-26-00000${2 * quarter}`,
		quarter === 2 ? "2026-08-14" : "2026-05-15",
		`Q${quarter} 2026`,
		fund,
	);
}

const INFORMATION_TABLE = {
	path: "Information table › Shares (sshPrnamt)",
	xbrlTag: null,
};

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
			fundFiling(fund, row, 2),
			INFORMATION_TABLE,
		),
	);
}

/**
 * The fund rows of the Relationships section: the shares of each 13F filer at
 * 30 Jun 2026 and at 31 Mar 2026. The shares a quarter earlier are the shares
 * now less the change, to the nearest million.
 */
export function fundHoldings(): FundHolding[] {
	const now = fundShares((row) => `relationships.funds.${row}.shares`);
	return funds().map(([fund, , change], row) => ({
		fund,
		shares: now[row],
		sharesQuarterEarlier:
			change === null
				? null
				: reported(
						{
							id: `relationships.funds.${row}.sharesQuarterEarlier`,
							label: `Shares held by ${fund} a quarter earlier`,
							value:
								Math.round(Number(now[row].value) / (1 + change / 100) / 1e6) *
								1_000_000,
							unit: "shares",
							period: QUARTER_EARLIER,
						},
						fundFiling(fund, row, 1),
						INFORMATION_TABLE,
					),
	}));
}

// The officers and directors with their role, their shares in millions, and
// the date of the latest Form 4 of each.
const INSIDERS: [string, string, number, string][] = [
	["Elena Marsh", "President and CEO", 861.4, "2026-06-18"],
	["Robert Chen-Hale", "Lead independent director", 51.8, "2026-04-21"],
	["Tomas Lindqvist", "EVP, Operations", 28.6, "2026-06-02"],
	["Miriam Holt", "Director", 12.3, "2026-03-14"],
	["Grace Adeyemi", "Director", 4.1, "2026-03-14"],
	["Priya Raman", "EVP and CFO", 3.2, "2026-06-02"],
];

/** The officers and directors who file a Form 4, in the order of the insider lists. */
export const INSIDER_NAMES = INSIDERS.map(([name]) => name);

function insiderShares(id: (row: number) => string): Claim[] {
	return INSIDERS.map(([name, , shares, filedOn], row) =>
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
 * The shares that each officer and director holds, from their latest Form 4.
 * The Relationships and Management sections each get their own copy, with the
 * same rows in the same order.
 */
export function insiderHoldings(
	section: "relationships" | "management",
): InsiderHolding[] {
	const shares = insiderShares((row) => `${section}.insiders.${row}.shares`);
	return INSIDERS.map(([name, role], row) => ({
		name,
		role,
		shares: shares[row],
	}));
}

/**
 * The ownership summary at 30 Jun 2026. The Overview and Relationships
 * sections each get their own copy, from the same filings. The copies differ
 * in the section prefix of their claim ids only.
 */
export function ownershipSummary(
	section: Exclude<HoldingSection, "management">,
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
