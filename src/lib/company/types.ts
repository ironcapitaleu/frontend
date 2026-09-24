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
	/**
	 * Who filed it: the company, the person who reports a Form 4, or the fund
	 * that files a 13F-HR. For a stake, it is the target company.
	 */
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
	/**
	 * The claims the formula reads. A formula can name one claim more than
	 * once, as `(Price − Price a month earlier) ÷ Price a month earlier` names
	 * the price a month earlier twice, and that claim is still one input.
	 */
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
 * Names one metric. This list holds the metrics that the sector benchmarks
 * name and the metrics that the checks read. Later tickets add the rest as
 * they add metrics.
 */
export type MetricKey =
	| "operatingMargin"
	| "returnOnEquity"
	| "dividendYield"
	| "buybackYield"
	| "totalDebt"
	| "currentRatio"
	| "stockPayToRevenue"
	| "marketCap"
	| "priceToEarnings"
	| "priceToEarningsAtYearEnd"
	| "priceToEarningsMedian10y"
	| "freeCashFlow"
	| "freeCashFlowYield"
	| "priceToFreeCashFlow"
	| "priceToBook"
	| "enterpriseValue"
	| "enterpriseValueToEbit"
	| "marketCapAtYearEnd"
	| "enterpriseValueAtYearEnd"
	| "priceToFreeCashFlowAtYearEnd"
	| "priceToFreeCashFlowMedian10y"
	| "priceToBookAtYearEnd"
	| "priceToBookMedian10y"
	| "enterpriseValueToEbitAtYearEnd"
	| "enterpriseValueToEbitMedian10y";

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

/** The data of the Valuation tab. */
export interface ValuationSection {
	/** The 10-year Treasury yield at each fiscal year end of the annual tables. */
	readonly treasuryYieldAtFiscalYearEnds: Series;
	/** The latest daily 10-year Treasury yield. */
	readonly treasuryYieldNow: Figure;
	/** Disjoint by `metric` from the benchmarks of the Overview section. */
	readonly sectorBenchmarks: readonly SectorBenchmark[];
}

/** The data of the Shareholder returns tab. */
export interface ShareholderReturnsSection {
	/** The dividend per share declared for each fiscal year. */
	readonly dividendPerShare: Series;
	readonly latestDividendDeclared: Figure;
	/** The shares bought back in each fiscal year, from the statement of shareholders' equity. */
	readonly sharesRepurchased: Series;
	/** The shares issued under staff plans in each fiscal year, from the statement of shareholders' equity. */
	readonly sharesIssuedToStaff: Series;
}

/** One fund that holds the company, from the 13F filings of two quarters. */
export interface FundHolding {
	readonly fund: string;
	readonly shares: Figure;
	readonly sharesQuarterEarlier: Figure;
}

/** The shares that one officer or director holds, from their latest Form 4. */
export interface InsiderHolding {
	readonly name: string;
	readonly role: string;
	readonly shares: Figure;
}

/** One subsidiary from 10-K Exhibit 21. */
export interface Subsidiary {
	readonly name: string;
	/** A text claim. */
	readonly jurisdiction: Figure;
}

/**
 * A stake in another listed company, from the company's own 13F information
 * table. `sharesOutstanding` comes from a filing of the target company.
 */
export interface Stake {
	readonly company: string;
	/**
	 * The ticker of the target company, or `null` when the filing names none.
	 * A known ticker does not mean the company has a page. The Relationships
	 * tab asks `servesTicker` before it links. Compare it with `equals`.
	 */
	readonly ticker: Nullable<Ticker>;
	readonly sharesHeld: Figure;
	readonly sharesOutstanding: Figure;
}

/** The data of the Relationships tab. */
export interface RelationshipsSection {
	/** The same figures as `OverviewSection.ownership`, under this section's ids. */
	readonly ownership: OwnershipSummary;
	readonly funds: readonly FundHolding[];
	/** The same rows as `ManagementSection.insiders`, in the same order, under this section's ids. */
	readonly insiders: readonly InsiderHolding[];
	readonly subsidiaries: readonly Subsidiary[];
	readonly stakes: readonly Stake[];
}

/** One executive or director, from the proxy statement. */
export interface Person {
	readonly name: string;
	readonly role: string;
	/** A row key. */
	readonly isDirector: boolean;
	readonly since: Figure;
	/** A text claim. */
	readonly independence: Figure;
}

/** The pay of the chief executive in one fiscal year, from the summary compensation table. */
export interface PayYear {
	/** A row key. The pay claims carry the sources. */
	readonly fiscalYear: number;
	readonly salary: Figure;
	readonly bonus: Figure;
	readonly stockAwards: Figure;
	readonly other: Figure;
}

/** The data of the Management tab. */
export interface ManagementSection {
	readonly people: readonly Person[];
	/** One row for each fiscal year, oldest first. */
	readonly ceoPay: readonly PayYear[];
	/** The same rows as `RelationshipsSection.insiders`, in the same order, under this section's ids. */
	readonly insiders: readonly InsiderHolding[];
	/** The shares that officers and directors bought in each fiscal year, from Form 4. */
	readonly insiderSharesBought: Series;
	/** The shares that officers and directors sold in each fiscal year, from Form 4. */
	readonly insiderSharesSold: Series;
}

/** The data of the Filings tab: the filings that the page reads. */
export interface FilingsSection {
	/** Newest first, as `DESIGN.md` §8 lists them. Ties go by accession number, highest first. */
	readonly filings: readonly Filing[];
}

/** The sections of one company as the port returns them. `null` marks a section that has not loaded. */
export interface CompanySections {
	readonly masthead: Nullable<MastheadSection>;
	readonly overview: Nullable<OverviewSection>;
	readonly financials: Nullable<FinancialsSection>;
	readonly valuation: Nullable<ValuationSection>;
	readonly shareholderReturns: Nullable<ShareholderReturnsSection>;
	readonly relationships: Nullable<RelationshipsSection>;
	readonly management: Nullable<ManagementSection>;
	readonly filings: Nullable<FilingsSection>;
}

/**
 * The sections after `completeSections` completes the quarterly tables. The
 * brand makes the compiler reject a call that passes the sections of the port.
 */
export type CompletedSections = CompanySections & {
	readonly [completedBrand]: true;
};

/** Names one tab of the company page, in the order of the tab strip. */
export type TabKey =
	| "overview"
	| "financials"
	| "valuation"
	| "shareholderReturns"
	| "relationships"
	| "management"
	| "filings";

/**
 * Names one chart, table or check card of a tab. It is a code key, so a card
 * title can change. This list holds the blocks of the Overview and Financials
 * tabs, the Shareholder returns block that only the printed Overview shows,
 * the Valuation blocks built so far, the Relationships blocks and the
 * Management blocks built so far. Each later tab adds its own keys.
 */
export type BlockKey =
	| "business"
	| "tenYears"
	| "keyFigures"
	| "financialPosition"
	| "checksByArea"
	| "ownership"
	| "profile"
	| "printedShareholderReturns"
	| "incomeChart"
	| "incomeTable"
	| "balanceChart"
	| "balanceTable"
	| "cashFlowChart"
	| "cashFlowTable"
	| "valuationRatios"
	| "ratioFormulas"
	| "largestFunds"
	| "insiders"
	| "ownershipSplit"
	| "subsidiaries"
	| "stakes"
	| "executivesAndBoard"
	| "ceoPay"
	| "payMix"
	| "insiderHoldings";

/**
 * The kind of figures in a group. `sector` figures come from a
 * {@link SectorBenchmark} field. Every other figure is a `company` figure.
 */
export type FigureKind = "company" | "sector";

/** Names the figures of one kind that one block draws. */
export interface FigureGroupRef {
	readonly tab: TabKey;
	readonly block: BlockKey;
	/** Display copy only. No function reads it to decide. */
	readonly label: string;
	readonly figures: FigureKind;
}

/** The claims of one {@link FigureGroupRef}. No section stores one. */
export interface FigureGroup {
	readonly ref: FigureGroupRef;
	readonly claims: readonly Claim[];
}

/** The reported claims that one document backs. */
export interface SourceGroup {
	readonly document: SourceDocument;
	readonly claims: readonly Claim[];
}

/** The reported sources behind some claims, one group for each document. No section stores one. */
export interface SourceSet {
	readonly groups: readonly SourceGroup[];
}
