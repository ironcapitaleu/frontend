import type { Ticker } from "../domain/ticker";

declare const isoDateBrand: unique symbol;
declare const completedBrand: unique symbol;

/** A calendar date as text, such as `2026-07-26`. The brand keeps it apart from a plain `string`. */
export type IsoDate = string & { readonly [isoDateBrand]: true };

/** A value that can be `null`. */
export type Nullable<T> = T | null;

/** An id that is unique on the page, such as `financials.revenue.FY2026`. */
export type ClaimId = string;

/** The value of a claim. A text claim uses the unit `text`. */
export type ClaimValue = number | string;

/**
 * The unit of a claim. A `usd` or `shares` value is in whole units. A
 * `percent` value is a fraction, so `0.15` is 15%. A `date` value is an
 * {@link IsoDate}.
 */
export type Unit =
	| "usd"
	| "usdPerShare"
	| "shares"
	| "percent"
	| "ratio"
	| "count"
	| "year"
	| "date"
	| "text";

/** The kind of stretch of time that a {@link Period} covers. */
export type PeriodKind =
	| "fiscalYear"
	| "fiscalQuarter"
	| "yearToDate"
	| "lastFourQuarters"
	| "instant";

/** The stretch of time or the date that a claim covers. */
export interface Period {
	readonly kind: PeriodKind;
	/** The fiscal year that the period falls in. */
	readonly fiscalYear: number;
	/**
	 * `1` to `4` for a quarter or a year to date. `null` for a fiscal year, the
	 * last four quarters and an instant in an annual table.
	 */
	readonly fiscalQuarter: Nullable<number>;
	/** The last day of the period, or the date of an instant. */
	readonly endsOn: IsoDate;
}

/** The form type of an SEC filing. */
export type FilingForm =
	| "10-K"
	| "10-Q"
	| "8-K"
	| "DEF 14A"
	| "Form 4"
	| "13F-HR";

/** An SEC filing that a reported claim comes from. */
export interface Filing {
	readonly kind: "filing";
	readonly form: FilingForm;
	/** The company that filed it. For a stake, this is the target company. */
	readonly filer: string;
	readonly accessionNumber: string;
	readonly filedOn: IsoDate;
	/** The period that the filing reports, as the page prints it, such as `FY2026`. */
	readonly periodLabel: string;
	/** A link to the filing index on SEC EDGAR. */
	readonly indexUrl: string;
}

/** A market dataset that a price or a yield comes from. */
export interface MarketDataset {
	readonly kind: "market";
	readonly name: string;
	readonly asOf: IsoDate;
	readonly url: string;
}

/** The document that a reported claim comes from. */
export type SourceDocument = Filing | MarketDataset;

/** The source of a claim that one document reports. */
export interface ReportedSource {
	readonly kind: "reported";
	readonly document: SourceDocument;
	/** The path to the line as the document prints it, such as `Consolidated statements of income › Revenue`. */
	readonly line: string;
	/** `null` when the document reports no XBRL fact for the figure. */
	readonly xbrlTag: Nullable<string>;
	/** A link to the exact document inside the filing, not to the filing index. */
	readonly url: string;
}

/** The source of a claim that a formula derives from other claims. */
export interface DerivedSource {
	readonly kind: "derived";
	readonly formula: string;
	/** One input claim for each term of the formula. */
	readonly inputs: readonly [Claim, ...Claim[]];
}

/** Where a claim comes from: one line in one document, or a formula over other claims. */
export type SourceRef = ReportedSource | DerivedSource;

/** One figure on the page, with its value, unit, period and source. */
export interface Claim {
	readonly id: ClaimId;
	readonly label: string;
	readonly value: ClaimValue;
	readonly unit: Unit;
	/**
	 * `null` for a reported fact with no stated period, and for a derived claim
	 * whose inputs do not share one period.
	 */
	readonly period: Nullable<Period>;
	readonly source: SourceRef;
}

/** A claim, or `null` for a missing figure. The page draws `null` as a dimmed `—`. */
export type Figure = Claim | null;

/** A run of figures, one for each period. `points[i]` is the figure for `periods[i]`. */
export interface Series {
	readonly key: string;
	readonly label: string;
	readonly unit: Unit;
	readonly periods: readonly Period[];
	readonly points: readonly Figure[];
}

/** One exchange listing of the company. */
export interface Listing {
	readonly exchange: string;
	readonly symbol: string;
}

/** The data of the masthead, which every tab shows. */
export interface MastheadSection {
	readonly ticker: Ticker;
	readonly name: string;
	readonly listings: readonly Listing[];
	readonly sector: string;
	readonly country: string;
	readonly reportingCurrency: string;
	/** The fiscal year end as a label, such as `Last Sunday of January`. */
	readonly fiscalYearEnd: string;
	readonly price: Figure;
	readonly priceMonthEarlier: Figure;
	readonly low52Weeks: Figure;
	readonly high52Weeks: Figure;
	readonly priceAtFiscalYearEnds: Series;
}

/**
 * Names one metric. This list holds the metrics that the Overview sector
 * benchmarks name. Later tickets add the rest as they add metrics.
 */
export type MetricKey =
	| "operatingMargin"
	| "returnOnEquity"
	| "dividendYield"
	| "buybackYield";

/** The quartiles of one metric over the company's peer group. */
export interface SectorBenchmark {
	readonly metric: MetricKey;
	readonly peerGroup: string;
	/** A row key. The quartile claims carry the sources. */
	readonly peerCount: number;
	readonly lowerQuartile: Figure;
	readonly median: Figure;
	readonly upperQuartile: Figure;
}

/** The revenue of one segment or one region. */
export interface RevenuePart {
	readonly name: string;
	readonly revenue: Figure;
}

/** The share counts behind the ownership bar. */
export interface OwnershipSummary {
	/** The quarter end that the 13F totals cover. It equals `institutionShares.period.endsOn`. */
	readonly asOf: IsoDate;
	readonly sharesOutstanding: Figure;
	readonly institutionShares: Figure;
	readonly insiderShares: Figure;
}

/** The facts of the company profile card. Each fact is a claim with its own source. */
export interface Profile {
	readonly founded: Figure;
	readonly headquarters: Figure;
	readonly employees: Figure;
	readonly chiefExecutive: Figure;
	readonly chiefExecutiveSince: Figure;
	readonly auditor: Figure;
	readonly website: Figure;
}

/** The data of the Overview tab. */
export interface OverviewSection {
	/** The business description, a text claim. */
	readonly business: Figure;
	readonly segments: readonly RevenuePart[];
	readonly regions: readonly RevenuePart[];
	/** Disjoint by `metric` from the benchmarks of the Valuation section. */
	readonly sectorBenchmarks: readonly SectorBenchmark[];
	readonly ownership: OwnershipSummary;
	readonly profile: Profile;
}

/** Names one reported statement line. Each key belongs to one statement. */
export type LineKey =
	| "revenue"
	| "operatingIncome"
	| "netIncome"
	| "dilutedEps"
	| "dilutedShares"
	| "totalCurrentAssets"
	| "totalAssets"
	| "totalCurrentLiabilities"
	| "totalLiabilities"
	| "shareholdersEquity"
	| "cashAndShortTermInvestments"
	| "shortTermDebt"
	| "longTermDebt"
	| "operatingCashFlow"
	| "capitalExpenditure"
	| "dividendsPaid"
	| "shareRepurchases"
	| "shareIssuanceProceeds"
	| "shareBasedCompensation";

/** One line of a statement table. It has the same `periods` as its table. */
export interface StatementLine extends Series {
	readonly key: LineKey;
	/** The indent of the line in the printed statement. */
	readonly level: number;
}

/** A table of statement lines over a run of periods. */
export interface StatementTable {
	readonly periods: readonly Period[];
	readonly lines: readonly StatementLine[];
}

/**
 * One financial statement. The port returns the quarterly table with `null`
 * points where no filing reports the quarter, such as each fourth quarter of
 * the income statement.
 */
export interface Statement {
	/** Ten fiscal years, up to the latest one that a 10-K covers. */
	readonly annual: StatementTable;
	/** The last eight fiscal quarters. */
	readonly quarterly: StatementTable;
	/**
	 * The reported six-month and nine-month figures. The income statement and
	 * the cash flow statement have them. The balance sheet has `null`.
	 */
	readonly yearToDate: Nullable<StatementTable>;
}

/** The data of the Financials tab: the three statements. */
export interface FinancialsSection {
	readonly income: Statement;
	readonly balance: Statement;
	readonly cashFlow: Statement;
}

/** The sections of one company as the port returns them. `null` marks a section that has not loaded. */
export interface CompanySections {
	readonly masthead: Nullable<MastheadSection>;
	readonly overview: Nullable<OverviewSection>;
	readonly financials: Nullable<FinancialsSection>;
}

/**
 * The sections after `completeSections` completes the quarterly tables. The
 * brand makes the compiler reject a call that passes the sections of the port.
 */
export type CompletedSections = CompanySections & {
	readonly [completedBrand]: true;
};
