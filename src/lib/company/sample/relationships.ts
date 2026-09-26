import type { RelationshipsSection, Stake, Subsidiary } from "../types";
import { dateInstant } from "./calendar";
import { fundHoldings, insiderHoldings, ownershipSummary } from "./holdings";
import { filing, reported, tenK } from "./sources";

// The subsidiaries that the mock-up lists from Exhibit 21 of the FY2026 10-K,
// with the jurisdiction of each.
const SUBSIDIARIES: [string, string][] = [
	["Meridian International Holdings Ltd.", "Cayman Islands"],
	["Meridian Semiconductor B.V.", "Netherlands"],
	["Meridian Semiconductor GmbH", "Germany"],
	["Meridian Semiconductor (Taiwan) Ltd.", "Taiwan"],
	["Meridian Israel Ltd.", "Israel"],
	["Meridian Semiconductor India Pvt. Ltd.", "India"],
	["Meridian Japan G.K.", "Japan"],
	["Meridian Networks LLC", "United States"],
];

function subsidiaries(): Subsidiary[] {
	const document = tenK(2026);
	return SUBSIDIARIES.map(([name, jurisdiction], row) => ({
		name,
		jurisdiction: reported(
			{
				id: `relationships.subsidiaries.${row}.jurisdiction`,
				label: `Jurisdiction of ${name}`,
				value: jurisdiction,
				unit: "text",
				period: null,
			},
			document,
			{
				path: `Exhibit 21 › ${name} › Jurisdiction`,
				xbrlTag: null,
				exhibit: "ex21.htm",
			},
		),
	}));
}

// The stakes from the mock-up: the company, the stake in percent and the
// shares outstanding in millions from the cover page of its latest 10-Q, with
// the date of that count and the filing date of the 10-Q. The sample serves
// MRDN only, so no target company has a page. The sample names no ticker,
// so every ticker is null.
const STAKES: [string, number, number, string, string][] = [
	["Halden Data Systems", 12.4, 310, "2026-08-03", "2026-08-06"],
	["Arcline Photonics", 7.2, 145, "2026-07-24", "2026-07-30"],
	["Tessellate Networks", 4.8, 520, "2026-08-10", "2026-08-12"],
	["Quarrystone Robotics", 3.1, 88, "2026-07-31", "2026-08-05"],
	["Velmora Biosciences", 1.9, 240, "2026-08-04", "2026-08-07"],
	["Brightkeel Energy", 0.8, 1200, "2026-07-28", "2026-07-31"],
];

/**
 * The stakes of Meridian in other listed companies. The shares held come from
 * the 13F-HR that Meridian filed for Q2 2026. The shares outstanding come from
 * the latest 10-Q of each company, which that company filed.
 */
function stakes(): Stake[] {
	const informationTable = filing(
		"13F-HR",
		"0001234567-26-000061",
		"2026-08-14",
		"Q2 2026",
	);
	return STAKES.map(
		([company, percent, outstanding, countedOn, filedOn], row) => ({
			company,
			ticker: null,
			sharesHeld: reported(
				{
					id: `relationships.stakes.${row}.sharesHeld`,
					label: `Shares of ${company} held`,
					value: Math.round(outstanding * percent * 10) * 1_000,
					unit: "shares",
					period: dateInstant("2026-06-30"),
				},
				informationTable,
				{ path: "Information table › Shares (sshPrnamt)", xbrlTag: null },
			),
			sharesOutstanding: reported(
				{
					id: `relationships.stakes.${row}.sharesOutstanding`,
					label: `Shares outstanding of ${company}`,
					value: outstanding * 1_000_000,
					unit: "shares",
					period: dateInstant(countedOn),
				},
				filing(
					"10-Q",
					`000600${String(row + 1).padStart(4, "0")}-26-000010`,
					filedOn,
					"Latest quarter",
					company,
				),
				{
					path: "Cover page › Shares outstanding",
					xbrlTag: "dei:EntityCommonStockSharesOutstanding",
				},
			),
		}),
	);
}

/**
 * The Relationships data of Meridian: the ownership summary at 30 Jun 2026,
 * the 13F funds of the last two quarters, the insiders, the subsidiaries of
 * Exhibit 21 and the stakes in listed companies. The ownership summary holds
 * the figures of the Overview copy, and the insiders hold the rows of the
 * Management copy, each under this section's ids.
 */
export const meridianRelationships: RelationshipsSection = {
	ownership: ownershipSummary("relationships"),
	funds: fundHoldings(),
	insiders: insiderHoldings("relationships"),
	subsidiaries: subsidiaries(),
	stakes: stakes(),
};
