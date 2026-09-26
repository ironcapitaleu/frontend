import type {
	Claim,
	Filing,
	MetricKey,
	OverviewSection,
	RevenuePart,
} from "../types";
import { fiscalYearPeriod, yearEndInstant } from "./calendar";
import { ownershipSummary } from "./holdings";
import { type Spread, sectorBenchmark } from "./peers";
import { proxy, reported, tenK } from "./sources";

const TEN_K = tenK(2026);
const PROXY = proxy(2026);
const FY2026_REVENUE = 212_000_000_000;

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
// the highest peer of each metric, over the US-listed semiconductor peers.
type BenchmarkedMetric = Extract<
	MetricKey,
	"operatingMargin" | "returnOnEquity" | "dividendYield" | "buybackYield"
>;
const SECTOR_SPREAD: Record<BenchmarkedMetric, Spread> = {
	operatingMargin: [-0.15, 0.09, 0.18, 0.27, 0.45],
	returnOnEquity: [-0.2, 0.07, 0.14, 0.22, 0.6],
	dividendYield: [0, 0.002, 0.008, 0.016, 0.045],
	buybackYield: [-0.01, 0.003, 0.011, 0.022, 0.06],
};
const METRIC_LABELS: Record<BenchmarkedMetric, string> = {
	operatingMargin: "Operating margin",
	returnOnEquity: "Return on equity",
	dividendYield: "Dividend yield",
	buybackYield: "Buyback yield",
};

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
	sectorBenchmarks: (Object.keys(SECTOR_SPREAD) as BenchmarkedMetric[]).map(
		(metric) =>
			sectorBenchmark(
				"overview",
				metric,
				METRIC_LABELS[metric],
				SECTOR_SPREAD[metric],
				"percent",
			),
	),
	ownership: ownershipSummary("overview"),
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
