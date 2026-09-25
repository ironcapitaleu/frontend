import { checks, figureRefsOf } from "./checks";
import { listedFundPositions } from "./holdings";
import {
	financialPositionInputs,
	keyFigureKeys,
	keyFigureOf,
	lineKeysOf,
	metricInputsOf,
	nestedInputsOf,
} from "./metrics";
import type {
	BlockKey,
	Claim,
	ClaimId,
	CompletedSections,
	Figure,
	FigureGroup,
	FigureGroupRef,
	FigureKind,
	Filing,
	FinancialsSection,
	LineKey,
	MastheadSection,
	MetricKey,
	Nullable,
	OwnershipSummary,
	ReportedSource,
	ShareholderReturnsSection,
	SourceDocument,
	SourceGroup,
	SourceSet,
	StatementTable,
	TabKey,
} from "./types";
import { ratioRanges } from "./valuationRatios";
import { yieldClaimsOf } from "./valuationYields";

/** A bar of a Financials chart: a statement line or a per-period metric. */
export type BarKey = LineKey | MetricKey;

/**
 * The bars each Financials chart draws, in this order (DESIGN.md §8
 * "Financials"). Free cash flow is a metric, drawn for each fiscal year. The
 * chart blocks read the lines and the lines that each metric reads.
 */
export const chartLines: Record<keyof FinancialsSection, readonly BarKey[]> = {
	income: ["revenue", "netIncome", "freeCashFlow"],
	balance: ["totalAssets", "totalLiabilities", "shareholdersEquity"],
	cashFlow: ["operatingCashFlow", "capitalExpenditure", "shareRepurchases"],
};

/** The yields of Shareholder returns card 4.5 "Total Shareholder Yield", stacked in this order. */
export const shareholderYields = [
	"dividendYieldAtYearEnd",
	"buybackYieldAtYearEnd",
] as const satisfies readonly BarKey[];

/** The series of Overview card 1.2 "Ten Years at a Glance", in its order. */
export const tenYearsBars: readonly BarKey[] = [
	"revenue",
	"operatingMargin",
	"freeCashFlow",
	"dilutedShares",
];

/**
 * Returns the claims of one kind that `block` draws. The `sector` claims are
 * the ones the block reads from a `SectorBenchmark` field, and the
 * `company` claims are all the others. So the two kinds share no claim.
 *
 * Returns an empty list when the sections of the block have not loaded.
 */
export function claimsOf(
	block: BlockKey,
	figures: FigureKind,
	sections: CompletedSections,
): Claim[] {
	return read(blocks[block], figures, sections) ?? [];
}

/**
 * Returns one group for each block of `tab` and each kind of figure the block
 * draws, in the order of the blocks. A block with sector figures gives a
 * `company` group and then a `sector` group.
 *
 * A block whose sections have not loaded gives no group. The masthead is not
 * a tab, so it gives no group.
 */
export function figureGroupsOf(
	tab: TabKey,
	sections: CompletedSections,
): FigureGroup[] {
	return blockKeys
		.filter((block) => blocks[block].tab === tab)
		.flatMap((block) => {
			const { label, sector } = blocks[block];
			const kinds: FigureKind[] = sector ? ["company", "sector"] : ["company"];
			return kinds.flatMap((figures) => {
				const claims = read(blocks[block], figures, sections);
				return claims ? [{ ref: { tab, block, label, figures }, claims }] : [];
			});
		});
}

/**
 * Tells whether `ref` names sector figures. It reads `ref.figures` only, so no
 * label decides it. The "Sources" chip, the sources index, the Filings walk
 * and the printed footer skip these groups, so they never name a peer filing.
 */
export function isSectorBenchmark(ref: FigureGroupRef): boolean {
	return ref.figures === "sector";
}

/**
 * Tells whether the printed summary draws the figures of `ref`. The paper
 * leaves out the sector medians and the Profile, and draws every other
 * Overview block, so a new Overview block reaches the printed footer by
 * default instead of dropping out of it.
 */
export function isOnPaper(ref: FigureGroupRef): boolean {
	return (
		ref.tab === "overview" && !isSectorBenchmark(ref) && ref.block !== "profile"
	);
}

/**
 * Tells whether `ref` names a block that only the printed page draws. It reads
 * the block's `printed` marker, so no label decides it. The on-screen sources
 * index skips these groups, so it names no filing that no figure on the
 * screen uses.
 */
export function isPrintedOnly(ref: FigureGroupRef): boolean {
	return blocks[ref.block].printed === true;
}

/** Tells whether a card on the screen draws the block of `ref`. It reads the block's `drawn` marker. */
export function isDrawn(ref: FigureGroupRef): boolean {
	return blocks[ref.block].drawn === true;
}

/**
 * Tells whether the screen names the filings of `ref`: a drawn block's
 * company figures. The sources index and the Filings card skip every other
 * group, so they name no filing that no figure on the screen uses.
 */
export function isOnScreen(ref: FigureGroupRef): boolean {
	return !isSectorBenchmark(ref) && !isPrintedOnly(ref) && isDrawn(ref);
}

/**
 * Returns the filings behind `claims`, newest first, as {@link sourcesOf}
 * orders them. It leaves out the market data.
 */
export function filingsOf(claims: readonly Claim[]): Filing[] {
	return sourcesOf(claims)
		.groups.map(({ document }) => document)
		.filter((document): document is Filing => document.kind === "filing");
}

/**
 * Returns the sector median of the key figure `metric`. P/E, P/FCF and P/B
 * read it from Valuation, and the other key figures from Overview. Returns
 * `null` when that section has not loaded or lists no benchmark of `metric`.
 */
export function sectorMedianOf(
	metric: MetricKey,
	sections: CompletedSections,
): Figure {
	const section = valuationKeyFigures.has(metric)
		? sections.valuation
		: sections.overview;
	return (
		section?.sectorBenchmarks.find((row) => row.metric === metric)?.median ??
		null
	);
}

/**
 * Names a document as the page writes it: a filing by its form, period and
 * filer, such as "10-K for FY2025, Meridian Semiconductor Inc.", or a market
 * dataset by its name.
 */
export function documentLabel(document: SourceDocument): string {
	return document.kind === "filing"
		? `${document.form} for ${document.periodLabel}, ${document.filer}`
		: document.name;
}

/**
 * Returns the reported sources of `claims`, one group for each filing or
 * market dataset. The filings come first, newest first, and the market data
 * comes last. A claim that two trees share appears once.
 */
export function sourcesOf(claims: readonly Claim[]): SourceSet {
	const groups = new Map<string, SourceGroup & { claims: Claim[] }>();
	for (const claim of reportedClaimsOf(claims)) {
		const { document } = claim.source;
		const key =
			document.kind === "filing"
				? document.accessionNumber
				: JSON.stringify([document.name, document.url]);
		const group = groups.get(key) ?? { document, claims: [] };
		group.claims.push(claim);
		groups.set(key, group);
	}
	return { groups: [...groups.values()].sort(byFilingsNewestFirst) };
}

/**
 * Maps the accession number of each filing to the groups whose claims reach
 * it, in the order of `groups`. A market dataset is not a filing, so it gets
 * no entry.
 */
export function feedsOf(
	groups: readonly FigureGroup[],
): Map<string, FigureGroupRef[]> {
	const feeds = new Map<string, FigureGroupRef[]>();
	for (const { ref, claims } of groups) {
		const filings = new Set<string>();
		for (const { source } of reportedClaimsOf(claims)) {
			if (source.document.kind === "filing") {
				filings.add(source.document.accessionNumber);
			}
		}
		for (const filing of filings) {
			const refs = feeds.get(filing) ?? [];
			refs.push(ref);
			feeds.set(filing, refs);
		}
	}
	return feeds;
}

/** Reads the figures of one kind of a block, or `null` when its sections have not loaded. */
type Reader = (sections: CompletedSections) => Nullable<readonly Figure[]>;

/** The tab, the label and the readers of one block. */
interface Block {
	readonly tab: TabKey;
	readonly label: string;
	readonly company: Reader;
	/** Only a block that draws `SectorBenchmark` figures has this reader. */
	readonly sector?: Reader;
	/** Marks a block that only the printed page draws, never the screen. */
	readonly printed?: true;
	/** Marks a block that a card on the screen draws today. A later ticket marks the others. */
	readonly drawn?: true;
}

/** The blocks of every tab, in the order of the page. */
const blockKeys = [
	"business",
	"tenYears",
	"keyFigures",
	"financialPosition",
	"checksByArea",
	"ownership",
	"profile",
	"printedShareholderReturns",
	"incomeChart",
	"incomeTable",
	"balanceChart",
	"balanceTable",
	"cashFlowChart",
	"cashFlowTable",
	"valuationRatios",
	"yieldsAgainstTreasury",
	"ratioFormulas",
	"dividendPerShare",
	"dividendsAgainstFreeCashFlow",
	"buybacksNetOfStaffShares",
	"shareCount",
	"totalShareholderYield",
	"largestFunds",
	"insiders",
	"ownershipSplit",
	"subsidiaries",
	"stakes",
	"executivesAndBoard",
	"ceoPay",
	"payMix",
	"insiderHoldings",
	"insiderBuyingAndSelling",
] as const satisfies readonly BlockKey[];

/**
 * Fails the type check when a `BlockKey` is missing from {@link blockKeys},
 * so a new block cannot drop out of its tab.
 */
const everyBlockListed: Exclude<
	BlockKey,
	(typeof blockKeys)[number]
> extends never
	? true
	: never = true;
void everyBlockListed;

/**
 * The key figures whose sector median Overview reads from `ValuationSection`
 * (note §4). EV/EBIT is not a key figure. A metric in both benchmark lists is
 * an adapter defect, and the page reads the Valuation entry.
 */
const valuationKeyFigures: ReadonlySet<MetricKey> = new Set<MetricKey>([
	"priceToEarnings",
	"priceToFreeCashFlow",
	"priceToBook",
]);

const blocks: Readonly<Record<BlockKey, Block>> = {
	business: {
		tab: "overview",
		label: "The Business",
		drawn: true,
		company: ({ overview }) =>
			overview && [
				overview.business,
				...[...overview.segments, ...overview.regions].map(
					(part) => part.revenue,
				),
			],
	},
	// The reported lines behind the four small charts, so the filing of a year
	// stays in the index when a margin or a free cash flow of that year has no
	// value.
	tenYears: {
		tab: "overview",
		label: "Ten Years at a Glance",
		drawn: true,
		company: ({ financials }) =>
			financials && annualPointsOf(financials, tenYearsBars),
	},
	keyFigures: {
		tab: "overview",
		label: "Key Figures",
		drawn: true,
		company: (sections) =>
			sections.masthead && sections.financials
				? keyFigureKeys.map((key) => keyFigureOf(key, sections))
				: null,
		// The medians the card draws: every key figure but market cap.
		sector: (sections) =>
			keyFigureKeys
				.filter((key) => key !== "marketCap")
				.map((key) => sectorMedianOf(key, sections)),
	},
	financialPosition: {
		tab: "overview",
		label: "Financial Position",
		drawn: true,
		// The reported inputs, not the long-term figures, so a filing stays in
		// the index when a long-term figure has no value.
		company: (sections) =>
			sections.financials && financialPositionInputs(sections),
	},
	// Every figure that card 1.5 compares, or the inputs of a figure with no
	// value, so the filing behind a check with not enough data stays in the
	// index.
	checksByArea: {
		tab: "overview",
		label: "Checks by Area",
		drawn: true,
		company: (sections) =>
			sections.financials &&
			checks.flatMap((check) =>
				figureRefsOf(check).flatMap((ref) => nestedInputsOf(ref, sections)),
			),
	},
	// The reported counts behind the three shares, not the shares: without the
	// shares outstanding every share is null, and reading the shares would drop
	// the 13F-HR and the Form 4 behind the counts from the index.
	ownership: {
		tab: "overview",
		label: "Who Owns It",
		drawn: true,
		company: ({ overview }) => overview && ownershipCounts(overview.ownership),
	},
	profile: {
		tab: "overview",
		label: "Profile",
		drawn: true,
		company: ({ overview }) => overview && Object.values(overview.profile),
	},
	// The printed page only. It shows the latest dividend per share and the
	// latest dividend declared, from `ShareholderReturnsSection`.
	printedShareholderReturns: {
		tab: "overview",
		label: "Shareholder returns, printed page",
		printed: true,
		company: ({ shareholderReturns }) =>
			shareholderReturns && [
				shareholderReturns.dividendPerShare.points.at(-1) ?? null,
				shareholderReturns.latestDividendDeclared,
			],
	},
	incomeChart: {
		tab: "financials",
		label: "Income statement chart",
		drawn: true,
		company: ({ financials }) =>
			financials && chartPointsOf(financials, "income"),
	},
	incomeTable: {
		tab: "financials",
		label: "Income statement table",
		drawn: true,
		company: ({ financials }) =>
			financials && [
				...pointsOf(financials.income.annual),
				...pointsOf(financials.income.quarterly),
			],
	},
	balanceChart: {
		tab: "financials",
		label: "Balance sheet chart",
		drawn: true,
		company: ({ financials }) =>
			financials && chartPointsOf(financials, "balance"),
	},
	balanceTable: {
		tab: "financials",
		label: "Balance sheet table",
		drawn: true,
		company: ({ financials }) =>
			financials && [
				...pointsOf(financials.balance.annual),
				...pointsOf(financials.balance.quarterly),
			],
	},
	cashFlowChart: {
		tab: "financials",
		label: "Cash flow chart",
		drawn: true,
		company: ({ financials }) =>
			financials && chartPointsOf(financials, "cashFlow"),
	},
	cashFlowTable: {
		tab: "financials",
		label: "Cash flow table",
		drawn: true,
		company: ({ financials }) =>
			financials && [
				...pointsOf(financials.cashFlow.annual),
				...pointsOf(financials.cashFlow.quarterly),
			],
	},
	// Card 3.1 reads the masthead, the financials and the valuation section.
	// The company figures are each ratio now and its own range and median.
	// The sector figures are the quartiles, so the index names no peer filing.
	valuationRatios: {
		tab: "valuation",
		label: "Ratios Against Their Own Ten Years and the Sector",
		drawn: true,
		company: (sections) =>
			valuationLoaded(sections)
				? ratioRanges(sections).flatMap((range) => [
						range.now,
						range.ownLow,
						range.ownMedian,
						range.ownHigh,
					])
				: null,
		sector: (sections) =>
			valuationLoaded(sections)
				? ratioRanges(sections).flatMap(({ sector }) =>
						sector
							? [sector.lowerQuartile, sector.median, sector.upperQuartile]
							: [],
					)
				: null,
	},
	// Card 3.2: each yield, or the inputs of a missing one (`yieldClaimsOf`).
	yieldsAgainstTreasury: {
		tab: "valuation",
		label: "Earnings Yield and FCF Yield Next to the 10-Year Treasury",
		drawn: true,
		company: (sections) =>
			valuationLoaded(sections) ? yieldClaimsOf(sections) : null,
	},
	// Card 3.3 draws each ratio now and each of its inputs, which it reads from
	// the metric definition. So the block reads the inputs too, and their
	// filings stay in the index when a ratio fails its guard.
	ratioFormulas: {
		tab: "valuation",
		label: "How the Ratios Are Built",
		drawn: true,
		company: (sections) =>
			valuationLoaded(sections)
				? ratioRanges(sections).flatMap(({ ratio, now }) => [
						now,
						...metricInputsOf(ratio, sections),
					])
				: null,
	},
	dividendPerShare: {
		tab: "shareholderReturns",
		label: "Dividend per Share",
		drawn: true,
		company: (sections) =>
			returnsLoaded(sections)
				? sections.shareholderReturns.dividendPerShare.points
				: null,
	},
	// Card 4.2 draws a share derived from these inputs. The block reads the
	// inputs, so their filings stay in the index when a share is `null`.
	dividendsAgainstFreeCashFlow: {
		tab: "shareholderReturns",
		label: "Dividends Paid Against Free Cash Flow",
		drawn: true,
		company: (sections) =>
			returnsLoaded(sections)
				? pointsOf(
						sections.financials.cashFlow.annual,
						lineKeysOf("dividendsToFreeCashFlow"),
					)
				: null,
	},
	// Card 4.3 reads both sides of every year, not `netBuyback`, so each 10-K
	// stays in the index when one side is missing and no net exists.
	buybacksNetOfStaffShares: {
		tab: "shareholderReturns",
		label: "Buybacks Net of Shares Issued to Staff",
		drawn: true,
		company: (sections) =>
			returnsLoaded(sections)
				? [
						...sections.shareholderReturns.sharesRepurchased.points,
						...sections.shareholderReturns.sharesIssuedToStaff.points,
					]
				: null,
	},
	shareCount: {
		tab: "shareholderReturns",
		label: "Share Count Over Ten Years",
		drawn: true,
		company: (sections) =>
			returnsLoaded(sections)
				? annualPointsOf(sections.financials, ["dilutedShares"])
				: null,
	},
	// Card 4.5 draws yields derived from these inputs: the cash of each year
	// and the year-end price and diluted shares of its market cap. The block
	// reads the inputs, so their filings stay in the index when a yield is
	// `null`.
	totalShareholderYield: {
		tab: "shareholderReturns",
		label: "Total Shareholder Yield",
		drawn: true,
		company: (sections) =>
			yieldLoaded(sections)
				? [
						...annualPointsOf(sections.financials, shareholderYields),
						...sections.masthead.priceAtFiscalYearEnds.points,
					]
				: null,
	},
	// The block reads the reported inputs of `fundShare` and `fundChange` for
	// the rows that card 5.1 lists, so the index names no other fund's 13F.
	largestFunds: {
		tab: "relationships",
		label: "Owned By: Largest Funds",
		drawn: true,
		company: ({ relationships }) =>
			relationships && [
				relationships.ownership.sharesOutstanding,
				...listedFundPositions(relationships.funds).flatMap((position) => {
					const row = relationships.funds[position];
					return [row.shares, row.sharesQuarterEarlier];
				}),
			],
	},
	insiders: {
		tab: "relationships",
		label: "Owned By: Insiders",
		drawn: true,
		company: ({ relationships }) =>
			relationships ? relationships.insiders.map((row) => row.shares) : null,
	},
	// The three shares that card 5.3 draws. The institutions share reaches the
	// 13F-HR of every fund, because its share count sums all funds.
	// Reads the counts, as the Who Owns It block does, for the same reason.
	ownershipSplit: {
		tab: "relationships",
		label: "Ownership Split",
		drawn: true,
		company: ({ relationships }) =>
			relationships && ownershipCounts(relationships.ownership),
	},
	subsidiaries: {
		tab: "relationships",
		label: "Owns: Subsidiaries",
		drawn: true,
		company: ({ relationships }) =>
			relationships
				? relationships.subsidiaries.map((row) => row.jurisdiction)
				: null,
	},
	// The reported inputs of the rows that card 5.5 draws: the shares held from
	// the company's own 13F-HR, and the shares outstanding from the 10-Q or
	// 10-K of the target company. Like the largest funds, the block reads the
	// inputs and not `stakePercent`, so the target's filing stays in the index
	// when the stake cannot be computed.
	stakes: {
		tab: "relationships",
		label: "Owns: Stakes in Listed Companies",
		drawn: true,
		company: ({ relationships }) =>
			relationships
				? relationships.stakes.flatMap((row) => [
						row.sharesHeld,
						row.sharesOutstanding,
					])
				: null,
	},
	// Card 6.1 reads each start, not `tenure`, so the DEF 14A stays in the
	// index when a tenure cannot be computed.
	executivesAndBoard: {
		tab: "management",
		label: "Executives and Board",
		drawn: true,
		company: ({ management }) =>
			management
				? management.people.flatMap((row) => [row.since, row.independence])
				: null,
	},
	// Card 6.2 reads every part, so a year with a missing part keeps its DEF 14A.
	ceoPay: {
		tab: "management",
		label: "CEO Pay by Year",
		drawn: true,
		company: ({ management }) =>
			management?.ceoPay.flatMap((y) => [
				y.salary,
				y.bonus,
				y.stockAwards,
				y.other,
			]) ?? null,
	},
	// Card 6.3 reads the four parts of the latest pay, not `payMix`, so the
	// DEF 14A stays in the index when a part is missing and no share exists.
	payMix: {
		tab: "management",
		label: "Pay Mix",
		drawn: true,
		company: ({ management }) => {
			if (!management) return null;
			const year = management.ceoPay.at(-1);
			return year
				? [year.salary, year.bonus, year.stockAwards, year.other]
				: [];
		},
	},
	insiderHoldings: {
		tab: "management",
		label: "Insider Holdings",
		drawn: true,
		company: ({ management }) =>
			management ? management.insiders.map((row) => row.shares) : null,
	},
	// Card 6.5 reads both sides of every year, not `netInsiderShares`, so each
	// Form 4 stays in the index when one side is missing and no net exists.
	insiderBuyingAndSelling: {
		tab: "management",
		label: "Insider Buying and Selling by Year",
		drawn: true,
		company: ({ management }) =>
			management
				? [
						...management.insiderSharesBought.points,
						...management.insiderSharesSold.points,
					]
				: null,
	},
};

/** Returns the claims of `figures`, or `null` when their sections have not loaded. */
function read(
	block: Block,
	figures: FigureKind,
	sections: CompletedSections,
): Nullable<Claim[]> {
	const reader = figures === "company" ? block.company : block.sector;
	return reader?.(sections)?.filter((figure) => figure !== null) ?? null;
}

/** Tells whether the sections that the Valuation cards read have loaded. */
function valuationLoaded({
	masthead,
	financials,
	valuation,
}: CompletedSections): boolean {
	return masthead !== null && financials !== null && valuation !== null;
}

/**
 * Tells whether both sections of the Shareholder returns tab have loaded. The
 * tab draws no card otherwise, so its blocks name no filing until then.
 */
function returnsLoaded(
	sections: CompletedSections,
): sections is CompletedSections & {
	financials: FinancialsSection;
	shareholderReturns: ShareholderReturnsSection;
} {
	return sections.financials !== null && sections.shareholderReturns !== null;
}

/**
 * Tells whether card 4.5 can draw: both sections of the tab and the masthead,
 * for its year-end prices, have loaded. The other cards of the tab draw
 * without the masthead.
 */
function yieldLoaded(
	sections: CompletedSections,
): sections is CompletedSections & {
	masthead: MastheadSection;
	financials: FinancialsSection;
	shareholderReturns: ShareholderReturnsSection;
} {
	return returnsLoaded(sections) && sections.masthead !== null;
}

/**
 * Returns the three reported counts that the ownership shares divide: the
 * shares outstanding, and the shares that institutions and insiders hold.
 */
function ownershipCounts(ownership: OwnershipSummary): Figure[] {
	return [
		ownership.sharesOutstanding,
		ownership.institutionShares,
		ownership.insiderShares,
	];
}

/** Returns the points of the lines `keys` of `table`, or of every line when `keys` is absent. */
function pointsOf(
	table: StatementTable,
	keys?: readonly LineKey[],
): readonly Figure[] {
	return table.lines
		.filter((line) => keys === undefined || keys.includes(line.key))
		.flatMap((line) => line.points);
}

/** Returns the annual points that the chart of `statement` draws. */
function chartPointsOf(
	financials: FinancialsSection,
	statement: keyof FinancialsSection,
): readonly Figure[] {
	return annualPointsOf(financials, chartLines[statement]);
}

/**
 * Returns the annual points of the lines `bars` read: each line, and the
 * lines each metric reads, by {@link lineKeysOf}. So a filing stays in the
 * index when a metric has no value for a year.
 */
function annualPointsOf(
	financials: FinancialsSection,
	bars: readonly BarKey[],
): readonly Figure[] {
	const keys = bars.flatMap(lineKeysOf);
	const { income, balance, cashFlow } = financials;
	return [income, balance, cashFlow].flatMap(({ annual }) =>
		pointsOf(annual, keys),
	);
}

/** A claim that one document reports. */
type ReportedClaim = Claim & { readonly source: ReportedSource };

function isReported(claim: Claim): claim is ReportedClaim {
	return claim.source.kind === "reported";
}

/**
 * Returns the reported claims that the trees of `claims` reach. It visits each
 * `ClaimId` once, so a shared input appears once and a cycle ends the walk.
 */
function reportedClaimsOf(claims: readonly Claim[]): ReportedClaim[] {
	const seen = new Set<ClaimId>();
	const found: ReportedClaim[] = [];
	const visit = (claim: Claim) => {
		if (seen.has(claim.id)) return;
		seen.add(claim.id);
		if (isReported(claim)) found.push(claim);
		else if (claim.source.kind === "derived")
			claim.source.inputs.forEach(visit);
	};
	claims.forEach(visit);
	return found;
}

/** Puts the filings first, newest first, and the market data last. */
function byFilingsNewestFirst(a: SourceGroup, b: SourceGroup): number {
	const first = a.document;
	const second = b.document;
	if (first.kind !== "filing" || second.kind !== "filing") {
		return kindRank(first.kind) - kindRank(second.kind);
	}
	if (first.filedOn > second.filedOn) return -1;
	if (first.filedOn < second.filedOn) return 1;
	return 0;
}

/** Ranks a filing before a market dataset. */
function kindRank(kind: SourceDocument["kind"]): number {
	return kind === "filing" ? 0 : 1;
}
