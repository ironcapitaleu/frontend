import type {
	Claim,
	Filing,
	MetricKey,
	OverviewSection,
	RevenuePart,
	SectorBenchmark,
} from "../types";
import {
	dateInstant,
	fiscalYearPeriod,
	printedDate,
	yearEndInstant,
} from "./calendar";
import { atLeastOne, derived, filing, reported, tenK, tenQ } from "./sources";

const TEN_K = tenK(2026);
const TEN_Q = tenQ({ year: 2027, quarter: 2 });
const PROXY = filing(
	"DEF 14A",
	"0001234567-26-000018",
	"2026-05-08",
	"2026 annual meeting",
);
const FY2026_REVENUE = 212_000_000_000;

function sum(claims: Claim[]): number {
	return claims.reduce((total, claim) => total + Number(claim.value), 0);
}

// The share of FY2026 revenue of each segment and each region, in percent.
const SEGMENTS: [string, number][] = [
	["Data centre", 81],
	["Gaming", 10],
	["Professional visualisation", 5],
	["Automotive", 4],
];
const REGIONS: [string, number][] = [
	["United States", 47],
	["Taiwan", 19],
	["China and Hong Kong", 13],
	["Rest of world", 21],
];

function revenueParts(
	list: "segments" | "regions",
	note: string,
	parts: [string, number][],
): RevenuePart[] {
	return parts.map(([name, percent], position) => ({
		name,
		revenue: reported(
			{
				id: `overview.${list}.${position}.revenue`,
				label: `${name} revenue`,
				value: (FY2026_REVENUE * percent) / 100,
				unit: "usd",
				period: fiscalYearPeriod(2026),
			},
			TEN_K,
			{ path: `Notes › ${note} › ${name}`, xbrlTag: "us-gaap:Revenues" },
		),
	}));
}

// The lowest peer, the lower quartile, the median, the upper quartile and
// the highest peer of each metric, over 61 US-listed semiconductor companies.
const PEER_COUNT = 61;
const SECTOR_SPREAD: Record<
	MetricKey,
	[number, number, number, number, number]
> = {
	operatingMargin: [-0.15, 0.09, 0.18, 0.27, 0.45],
	returnOnEquity: [-0.2, 0.07, 0.14, 0.22, 0.6],
	dividendYield: [0, 0.002, 0.008, 0.016, 0.045],
	buybackYield: [-0.01, 0.003, 0.011, 0.022, 0.06],
};
const METRIC_LABELS: Record<MetricKey, string> = {
	operatingMargin: "Operating margin",
	returnOnEquity: "Return on equity",
	dividendYield: "Dividend yield",
	buybackYield: "Buyback yield",
};

/**
 * Builds the quartiles of one metric over made-up peers. The peer figures rise
 * in straight steps between the five points of `SECTOR_SPREAD`, so the 16th,
 * 31st and 46th peer hold the quartiles and the median.
 */
function benchmark(metric: MetricKey): SectorBenchmark {
	const spread = SECTOR_SPREAD[metric];
	const name = METRIC_LABELS[metric];
	const quarter = (PEER_COUNT - 1) / 4;
	const peers = Array.from({ length: PEER_COUNT }, (_, rank) => {
		const step = Math.min(Math.floor(rank / quarter), 3);
		const fraction = (rank - step * quarter) / quarter;
		const value =
			Math.round(
				(spread[step] + (spread[step + 1] - spread[step]) * fraction) * 10_000,
			) / 10_000;
		const peer = `Semiconductor peer ${rank + 1}`;
		const document = filing(
			"10-K",
			`000900${String(rank + 1).padStart(4, "0")}-26-000001`,
			"2026-03-20",
			"Latest fiscal year",
			peer,
		);
		return reported(
			{
				id: `overview.sectorBenchmarks.${metric}.peers.${rank}`,
				label: `${name}, ${peer}`,
				value,
				unit: "percent",
				period: null,
			},
			document,
			{ path: `Peer figure › ${name}`, xbrlTag: null },
		);
	});
	const quartile = (
		field: "lowerQuartile" | "median" | "upperQuartile",
		title: string,
		position: number,
	) =>
		derived(
			{
				id: `overview.sectorBenchmarks.${metric}.${field}`,
				label: `Sector ${name.toLowerCase()}, ${title.toLowerCase()}`,
				value: peers[position].value,
				unit: "percent",
				period: null,
			},
			`${title} of ${name.toLowerCase()} across ${PEER_COUNT} US-listed semiconductor companies`,
			atLeastOne(peers, `the peers of ${metric}`),
		);
	return {
		metric,
		peerGroup: "US-listed semiconductor companies",
		peerCount: PEER_COUNT,
		lowerQuartile: quartile("lowerQuartile", "Lower quartile", quarter),
		median: quartile("median", "Median", 2 * quarter),
		upperQuartile: quartile("upperQuartile", "Upper quartile", 3 * quarter),
	};
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

function fundHoldings(): [string, number][] {
	const smaller = Array.from({ length: 31 }, (_, row): [string, number] => [
		`Fund ${row + 7}`,
		0.43 - 0.009 * row,
	]);
	const listed = [...LARGEST_FUNDS, ...smaller];
	const rest =
		INSTITUTION_SHARES -
		listed.reduce((total, [, shares]) => total + shares, 0);
	return [...listed, ["Fund 38", rest]];
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

function ownership(): OverviewSection["ownership"] {
	const quarterEnd = dateInstant("2026-06-30");
	const funds = fundHoldings().map(([fund, shares], row) =>
		reported(
			{
				id: `overview.ownership.institutionShares.funds.${row}`,
				label: `Shares held by ${fund}`,
				value: Math.round(shares * 1000) * 1_000_000,
				unit: "shares",
				period: quarterEnd,
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
	const insiders = INSIDERS.map(([name, shares, filedOn], row) =>
		reported(
			{
				id: `overview.ownership.insiderShares.insiders.${row}`,
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
	const institutionShares = derived(
		{
			id: "overview.ownership.institutionShares",
			label: "Shares held by institutions",
			value: sum(funds),
			unit: "shares",
			period: quarterEnd,
		},
		`Sum of the shares in the 13F-HR filings of ${funds.length} funds`,
		atLeastOne(funds, "the 13F-HR funds"),
	);
	return {
		asOf: quarterEnd.endsOn,
		sharesOutstanding: reported(
			{
				id: "overview.ownership.sharesOutstanding.2026-08-21",
				label: "Shares outstanding",
				value: 24_400_000_000,
				unit: "shares",
				period: dateInstant("2026-08-21"),
			},
			TEN_Q,
			{
				path: "Cover page › Shares outstanding",
				xbrlTag: "dei:EntityCommonStockSharesOutstanding",
			},
		),
		institutionShares,
		insiderShares: derived(
			{
				id: "overview.ownership.insiderShares",
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

function profileFact(
	key: string,
	label: string,
	value: string | number,
	unit: Claim["unit"],
	document: Filing,
	path: string,
	xbrlTag: string | null = null,
) {
	const period = key === "employees" ? yearEndInstant(2026) : null;
	const id =
		period === null
			? `overview.profile.${key}`
			: `overview.profile.${key}.${period.endsOn}`;
	return reported({ id, label, value, unit, period }, document, {
		path,
		xbrlTag,
	});
}

/**
 * The Overview data of Meridian: the business, the FY2026 revenue by segment
 * and by region, the sector benchmarks, the ownership summary at 30 Jun 2026
 * and the profile.
 */
export const meridianOverview: OverviewSection = {
	business: reported(
		{
			id: "overview.business",
			label: "The business",
			value:
				"Meridian designs graphics processors, and the networking, systems and software that join them into data-centre computers. It does not make its own chips: contract foundries in Taiwan build them. Most revenue now comes from cloud providers and large companies buying computing capacity for AI. Gaming, once the core of the business, is now a tenth of sales.",
			unit: "text",
			period: fiscalYearPeriod(2026),
		},
		TEN_K,
		{ path: "Item 1 › Business", xbrlTag: null },
	),
	segments: revenueParts("segments", "Segment information", SEGMENTS),
	regions: revenueParts("regions", "Revenue by geography", REGIONS),
	sectorBenchmarks: (Object.keys(SECTOR_SPREAD) as MetricKey[]).map(benchmark),
	ownership: ownership(),
	profile: {
		founded: profileFact(
			"founded",
			"Founded",
			1993,
			"year",
			TEN_K,
			"Item 1 › Business › General",
		),
		headquarters: profileFact(
			"headquarters",
			"Headquarters",
			"Santa Clara, California",
			"text",
			TEN_K,
			"Cover page › Address of principal executive offices",
			"dei:EntityAddressCityOrTown",
		),
		employees: profileFact(
			"employees",
			"Employees",
			36_000,
			"count",
			TEN_K,
			"Item 1 › Human capital",
		),
		chiefExecutive: profileFact(
			"chiefExecutive",
			"Chief executive",
			"Elena Marsh",
			"text",
			PROXY,
			"Executive officers › Elena Marsh",
		),
		chiefExecutiveSince: profileFact(
			"chiefExecutiveSince",
			"Chief executive since",
			1993,
			"year",
			PROXY,
			"Executive officers › Elena Marsh",
		),
		auditor: profileFact(
			"auditor",
			"Auditor",
			"Whitlock & Ames LLP",
			"text",
			TEN_K,
			"Item 14 › Principal accountant",
			"dei:AuditorName",
		),
		website: profileFact(
			"website",
			"Website",
			"https://meridian.example",
			"text",
			TEN_K,
			"Cover page › Website",
		),
	},
};
