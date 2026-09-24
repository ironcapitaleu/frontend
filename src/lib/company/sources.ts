import { listedFundPositions } from "./holdings";
import { ownershipShares } from "./metrics";
import type {
	BlockKey,
	Claim,
	ClaimId,
	CompletedSections,
	Figure,
	FigureGroup,
	FigureGroupRef,
	FigureKind,
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
	"largestFunds",
	"insiders",
	"ownershipSplit",
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

// The derived metrics of the Overview blocks, such as the operating margin,
// the free cash flow and the ratios of Key Figures, need `evaluateMetric`
// (STA-229). Until it exists, each block reads its reported figures only. A
// later part of STA-226 adds the checks, so "Checks by Area" reads no figure yet.
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
		company: ({ overview }) => overview && [],
		sector: ({ overview, valuation }) =>
			overview && [
				...overview.sectorBenchmarks
					.filter(({ metric }) => !valuationKeyFigures.has(metric))
					.map((row) => row.median),
				...(valuation?.sectorBenchmarks ?? [])
					.filter(({ metric }) => valuationKeyFigures.has(metric))
					.map((row) => row.median),
			],
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
	// DESIGN.md §8 names the lines of the income chart only. The other two
	// charts read every line of their annual table until the Financials tab
	// ticket names them. Free cash flow waits for STA-229.
	incomeChart: {
		tab: "financials",
		label: "Income statement chart",
		company: ({ financials }) =>
			financials &&
			pointsOf(financials.income.annual, ["revenue", "netIncome"]),
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
			financials && pointsOf(financials.balance.annual),
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
			financials && pointsOf(financials.cashFlow.annual),
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
			relationships && Object.values(ownershipShares(relationships)),
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
