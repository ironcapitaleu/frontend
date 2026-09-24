import type {
	Claim,
	ClaimValue,
	Filing,
	FilingForm,
	MarketDataset,
	Nullable,
	Period,
	ReportedSource,
	SourceDocument,
	Unit,
} from "../types";
import { type FiscalQuarter, isoDate } from "./calendar";

/**
 * A line record: the place of one figure in a document. `path` is the line as
 * the document prints it, such as `Consolidated statements of income › Revenue`.
 * `xbrlTag` is `null` when the document reports no XBRL fact for the figure.
 */
export interface LineRecord {
	readonly path: string;
	readonly xbrlTag: Nullable<string>;
}

/** The made-up company that files the sample filings. */
export const MERIDIAN = "Meridian Semiconductor Corp.";

// The made-up EDGAR folder of Meridian. The reserved `.example` domain makes
// sure that no link opens the filing of a real company.
const EDGAR = "https://edgar.example/Archives/edgar/data/1234567";

// The document inside a filing that a reported source opens.
const DOCUMENT_NAMES: Record<FilingForm, string> = {
	"10-K": "mrdn-10k.htm",
	"10-Q": "mrdn-10q.htm",
	"8-K": "mrdn-8k.htm",
	"DEF 14A": "mrdn-def14a.htm",
	"Form 4": "form4.xml",
	"13F-HR": "infotable.xml",
};

/**
 * Builds a filing record: its form, filer, accession number, filing date and
 * the link to its index on the made-up EDGAR host.
 */
export function filing(
	form: FilingForm,
	accessionNumber: string,
	filedOn: string,
	periodLabel: string,
	filer: string = MERIDIAN,
): Filing {
	return {
		kind: "filing",
		form,
		filer,
		accessionNumber,
		filedOn: isoDate(filedOn),
		periodLabel,
		indexUrl: `${EDGAR}/${accessionNumber.replaceAll("-", "")}/`,
	};
}

// The date on which Meridian filed the 10-K of each fiscal year.
const TEN_K_FILED_ON: Record<number, string> = {
	2017: "2017-03-10",
	2018: "2018-03-09",
	2019: "2019-03-08",
	2020: "2020-03-13",
	2021: "2021-03-12",
	2022: "2022-03-11",
	2023: "2023-03-10",
	2024: "2024-03-08",
	2025: "2025-03-13",
	2026: "2026-03-12",
};

// The date on which Meridian filed each 10-Q of the sample data.
const TEN_Q_FILED_ON: Record<string, string> = {
	"Q2 FY2025": "2024-08-28",
	"Q3 FY2025": "2024-11-20",
	"Q1 FY2026": "2025-05-28",
	"Q2 FY2026": "2025-08-27",
	"Q3 FY2026": "2025-11-19",
	"Q1 FY2027": "2026-05-28",
	"Q2 FY2027": "2026-08-27",
};

/** Returns the 10-K record of a fiscal year, such as the FY2026 10-K filed on 12 Mar 2026. */
export function tenK(year: number): Filing {
	const filedOn = TEN_K_FILED_ON[year];
	return filing(
		"10-K",
		`0001234567-${filedOn.slice(2, 4)}-000012`,
		filedOn,
		`FY${year}`,
	);
}

/** Returns the 10-Q record of one of the first three quarters of a fiscal year. */
export function tenQ({ year, quarter }: FiscalQuarter): Filing {
	const label = `Q${quarter} FY${year}`;
	const filedOn = TEN_Q_FILED_ON[label];
	return filing(
		"10-Q",
		`0001234567-${filedOn.slice(2, 4)}-0000${20 + 10 * quarter}`,
		filedOn,
		label,
	);
}

/**
 * The 10-K and 10-Q records of Meridian, oldest first: the 10-K for each
 * fiscal year from FY2017 to FY2026, and the 10-Q for each quarter of the
 * sample data. The latest is the 10-Q for Q2 FY2027, filed on 27 Aug 2026.
 * The windows of the statement tables end at the latest period that these
 * filings cover.
 */
export const meridianFilings: readonly Filing[] = [
	...Object.keys(TEN_K_FILED_ON).map((year) => tenK(Number(year))),
	...Object.keys(TEN_Q_FILED_ON).map((label) =>
		tenQ({ year: Number(label.slice(5)), quarter: Number(label[1]) }),
	),
].sort((first, second) => first.filedOn.localeCompare(second.filedOn));

/**
 * Builds the source of a reported figure from one document record and one
 * line record. For a filing, the link opens the document inside the filing,
 * not the filing index. For a market dataset, the link opens the dataset.
 */
export function reportedSource(
	document: SourceDocument,
	line: LineRecord,
): ReportedSource {
	return {
		kind: "reported",
		document,
		line: line.path,
		xbrlTag: line.xbrlTag,
		url:
			document.kind === "filing"
				? `${document.indexUrl}${DOCUMENT_NAMES[document.form]}`
				: document.url,
	};
}

/** The fields that every claim has, apart from its source. */
export interface ClaimFields {
	readonly id: string;
	readonly label: string;
	readonly value: ClaimValue;
	readonly unit: Unit;
	readonly period: Nullable<Period>;
}

/** Builds a reported claim. Its source comes from {@link reportedSource}. */
export function reported(
	fields: ClaimFields,
	document: SourceDocument,
	line: LineRecord,
): Claim {
	return { ...fields, source: reportedSource(document, line) };
}

/** Builds a derived claim from a formula and one input claim for each term. */
export function derived(
	fields: ClaimFields,
	formula: string,
	inputs: readonly [Claim, ...Claim[]],
): Claim {
	return { ...fields, source: { kind: "derived", formula, inputs } };
}

/** The end-of-day prices of MRDN on NASDAQ, up to 23 Sep 2026. */
export const nasdaqPrices: MarketDataset = {
	kind: "market",
	name: "End-of-day prices, NASDAQ",
	asOf: isoDate("2026-09-23"),
	url: "https://prices.example/NASDAQ/MRDN",
};
