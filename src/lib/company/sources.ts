import { listedFundPositions } from "./holdings";
import {
	keyFigureKeys,
	keyFigureOf,
	metricInputsOf,
	ownershipShares,
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
	MetricKey,
	Nullable,
	ReportedSource,
	SourceDocument,
	SourceGroup,
	SourceSet,
	StatementTable,
	TabKey,
} from "./types";
import { ratioRanges } from "./valuationRatios";

/**
 * The statement lines each Financials chart draws, as bars in this order
 * (DESIGN.md §8 "Financials"). The chart blocks read these lines only. Free
 * cash flow, which §8 also names for the income chart, is a metric, not a
 * statement line, and it joins the chart later.
 */
export const chartLines: Record<keyof FinancialsSection, readonly LineKey[]> = {
	income: ["revenue", "netIncome"],
	balance: ["totalAssets", "totalLiabilities", "shareholdersEquity"],
	cashFlow: ["operatingCashFlow", "capitalExpenditure", "shareRepurchases"],
};

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
 * Tells whether `ref` names a block that only the printed page draws. It reads
 * the block's `printed` marker, so no label decides it. The on-screen sources
 * index skips these groups, so it names no filing that no figure on the
 * screen uses.
 */
export function isPrintedOnly(ref: FigureGroupRef): boolean {
	return blocks[ref.block].printed === true;
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
	"ratioFormulas",
	"largestFunds",
	"insiders",
	"ownershipSplit",
	"subsidiaries",
	"stakes",
	"executivesAndBoard",
	"payMix",
	"insiderHoldings",
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

// A later part of STA-226 adds the checks, so "Checks by Area" reads no
// figure yet.
const blocks: Readonly<Record<BlockKey, Block>> = {
	business: {
		tab: "overview",
		label: "The Business",
		company: ({ overview }) =>
			overview && [
				overview.business,
				...[...overview.segments, ...overview.regions].map(
					(part) => part.revenue,
				),
			],
	},
	tenYears: {
		tab: "overview",
		label: "Ten Years at a Glance",
		company: ({ financials }) =>
			financials &&
			pointsOf(financials.income.annual, ["revenue", "dilutedShares"]),
	},
	keyFigures: {
		tab: "overview",
		label: "Key Figures",
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
		company: ({ financials }) =>
			financials &&
			latestOf(financials.balance.quarterly, [
				"totalCurrentAssets",
				"totalAssets",
				"totalCurrentLiabilities",
				"totalLiabilities",
			]),
	},
	checksByArea: {
		tab: "overview",
		label: "Checks by Area",
		company: ({ overview, financials }) => overview && financials && [],
	},
	ownership: {
		tab: "overview",
		label: "Who Owns It",
		company: ({ overview }) =>
			overview && [
				overview.ownership.sharesOutstanding,
				overview.ownership.institutionShares,
				overview.ownership.insiderShares,
			],
	},
	profile: {
		tab: "overview",
		label: "Profile",
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
	// Free cash flow joins the income chart with STA-229.
	incomeChart: {
		tab: "financials",
		label: "Income statement chart",
		company: ({ financials }) =>
			financials && pointsOf(financials.income.annual, chartLines.income),
	},
	incomeTable: {
		tab: "financials",
		label: "Income statement table",
		company: ({ financials }) =>
			financials && [
				...pointsOf(financials.income.annual),
				...pointsOf(financials.income.quarterly),
			],
	},
	balanceChart: {
		tab: "financials",
		label: "Balance sheet chart",
		company: ({ financials }) =>
			financials && pointsOf(financials.balance.annual, chartLines.balance),
	},
	balanceTable: {
		tab: "financials",
		label: "Balance sheet table",
		company: ({ financials }) =>
			financials && [
				...pointsOf(financials.balance.annual),
				...pointsOf(financials.balance.quarterly),
			],
	},
	cashFlowChart: {
		tab: "financials",
		label: "Cash flow chart",
		company: ({ financials }) =>
			financials && pointsOf(financials.cashFlow.annual, chartLines.cashFlow),
	},
	cashFlowTable: {
		tab: "financials",
		label: "Cash flow table",
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
	// Card 3.3 draws each ratio now and each of its inputs, which it reads from
	// the metric definition. So the block reads the inputs too, and their
	// filings stay in the index when a ratio fails its guard.
	ratioFormulas: {
		tab: "valuation",
		label: "How the Ratios Are Built",
		company: (sections) =>
			valuationLoaded(sections)
				? ratioRanges(sections).flatMap(({ ratio, now }) => [
						now,
						...metricInputsOf(ratio, sections),
					])
				: null,
	},
	// The block reads the reported inputs of `fundShare` and `fundChange` for
	// the rows that card 5.1 lists, so the index names no other fund's 13F.
	largestFunds: {
		tab: "relationships",
		label: "Owned By: Largest Funds",
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
		company: ({ relationships }) =>
			relationships ? relationships.insiders.map((row) => row.shares) : null,
	},
	// The three shares that card 5.3 draws. The institutions share reaches the
	// 13F-HR of every fund, because its share count sums all funds.
	ownershipSplit: {
		tab: "relationships",
		label: "Ownership Split",
		company: ({ relationships }) =>
			relationships &&
			Object.values(ownershipShares(relationships, "relationships")),
	},
	subsidiaries: {
		tab: "relationships",
		label: "Owns: Subsidiaries",
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
		company: ({ management }) =>
			management
				? management.people.flatMap((row) => [row.since, row.independence])
				: null,
	},
	// Card 6.3 reads the four parts of the latest pay, not `payMix`, so the
	// DEF 14A stays in the index when a part is missing and no share exists.
	payMix: {
		tab: "management",
		label: "Pay Mix",
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
		company: ({ management }) =>
			management ? management.insiders.map((row) => row.shares) : null,
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

/** Returns the points of the lines `keys` of `table`, or of every line when `keys` is absent. */
function pointsOf(
	table: StatementTable,
	keys?: readonly LineKey[],
): readonly Figure[] {
	return table.lines
		.filter((line) => keys === undefined || keys.includes(line.key))
		.flatMap((line) => line.points);
}

/** Returns the latest point of the lines `keys` of `table`. */
function latestOf(table: StatementTable, keys: readonly LineKey[]): Figure[] {
	return table.lines
		.filter((line) => keys.includes(line.key))
		.map((line) => line.points.at(-1) ?? null);
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
