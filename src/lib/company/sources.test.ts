import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { LISTED_FUNDS } from "./holdings";
import { completeSections, tenure } from "./metrics";
import {
	claimsOf,
	feedsOf,
	figureGroupsOf,
	isPrintedOnly,
	isSectorBenchmark,
	sectorMedianOf,
	sourcesOf,
} from "./sources";
import type {
	BlockKey,
	Claim,
	Filing,
	FigureGroup,
	FigureGroupRef,
	LineKey,
	StatementTable,
} from "./types";
import { ratioRanges, valuationRatios } from "./valuationRatios";

const sections = completeSections(fakeCompanyReport);

const { masthead, overview, financials, valuation } = fakeCompanyReport;

/** The ratios of card 3.1. */
const ratios = new Set<string>(valuationRatios);

/** The accession number of the FY2025 10-K of the fixture. */
const TEN_K_2025 = "0001999999-26-000003";

/** Returns the claim of `figure`, and fails the test when the figure is missing. */
function claim(figure: Claim | null | undefined): Claim {
	if (!figure) throw new Error("The fixture has no such figure.");
	return figure;
}

/** Returns the filing that `reported` comes from, and fails the test for any other claim. */
function filingOf(reported: Claim): Filing {
	const { source } = reported;
	if (source.kind !== "reported" || source.document.kind !== "filing") {
		throw new Error("The claim does not come from a filing.");
	}
	return source.document;
}

const price = claim(masthead.price);
const eps2025 = claim(
	financials.income.annual.lines.find((line) => line.key === "dilutedEps")
		?.points[9],
);
const revenue2016 = claim(financials.income.annual.lines[0].points[0]);

/** Returns a derived claim over `inputs`. */
function derived(id: string, inputs: [Claim, ...Claim[]]): Claim {
	return {
		id,
		label: id,
		value: 1,
		unit: "ratio",
		period: null,
		source: { kind: "derived", formula: "made up", inputs },
	};
}

/** The completed statements that the blocks of the Financials tab read. */
const statements = (() => {
	if (!sections.financials) throw new Error("The fixture has no financials.");
	return sections.financials;
})();

/** Returns the claims of the lines `keys` of `tables`, or of every line when `keys` is absent. */
function claimsIn(tables: StatementTable[], keys?: LineKey[]): Claim[] {
	return tables.flatMap((table) =>
		table.lines
			.filter((line) => keys === undefined || keys.includes(line.key))
			.flatMap((line) => line.points)
			.filter((point) => point !== null),
	);
}

/** Returns the ids of the documents of `sourcesOf(claims)`, in order. */
function documentIds(claims: Claim[]): string[] {
	return sourcesOf(claims).groups.map(({ document }) =>
		document.kind === "filing" ? document.accessionNumber : document.name,
	);
}

describe("claimsOf", () => {
	it("should read the eight key figures when the company figures of Key Figures are read", () => {
		const expectedResult = 8;

		const result = claimsOf("keyFigures", "company", sections).length;

		expect(result).toBe(expectedResult);
	});

	it("should share no ClaimId when the two kinds of Key Figures are read", () => {
		const sector = new Set(
			claimsOf("keyFigures", "sector", sections).map(({ id }) => id),
		);

		const expectedResult: string[] = [];

		const result = claimsOf("keyFigures", "company", sections)
			.map(({ id }) => id)
			.filter((id) => sector.has(id));

		expect(result).toEqual(expectedResult);
	});

	it("should hold the Overview medians and the P/E, P/FCF and P/B medians of Valuation in card order when the sector figures of Key Figures are read", () => {
		// EV/EBIT is not a key figure, so its median stays out.
		const rows = [...overview.sectorBenchmarks, ...valuation.sectorBenchmarks];
		const expectedResult = [
			"priceToEarnings",
			"priceToFreeCashFlow",
			"priceToBook",
			"operatingMargin",
			"returnOnEquity",
			"dividendYield",
			"buybackYield",
		].map((metric) =>
			claim(rows.find((row) => row.metric === metric)?.median ?? null),
		);

		const result = claimsOf("keyFigures", "sector", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should leave out a benchmark the card does not draw when Overview lists one", () => {
		const [first] = overview.sectorBenchmarks;
		const extra = completeSections({
			...fakeCompanyReport,
			overview: {
				...overview,
				sectorBenchmarks: [
					...overview.sectorBenchmarks,
					{ ...first, metric: "enterpriseValueToEbit" },
				],
			},
		});

		const expectedResult = claimsOf("keyFigures", "sector", sections).length;

		const result = claimsOf("keyFigures", "sector", extra).length;

		expect(result).toBe(expectedResult);
	});

	it("should hold only the Overview medians when the sector figures of Key Figures are read and the Valuation section has not loaded", () => {
		const withoutValuation = completeSections({
			...fakeCompanyReport,
			valuation: null,
		});

		const expectedResult = overview.sectorBenchmarks.map(({ median }) =>
			claim(median),
		);

		const result = claimsOf("keyFigures", "sector", withoutValuation);

		expect(result).toEqual(expectedResult);
	});

	it.each([
		["priceToEarnings", "valuation.sectorBenchmarks.priceToEarnings.median"],
		["returnOnEquity", "overview.sectorBenchmarks.returnOnEquity.median"],
	] as const)(
		"should read the median of %s from its section when sectorMedianOf is called",
		(metric, expectedResult) => {
			const result = sectorMedianOf(metric, sections)?.id;

			expect(result).toBe(expectedResult);
		},
	);

	it("should return no claim when a block with no sector reader is read for sector figures", () => {
		const expectedResult: Claim[] = [];

		const result = claimsOf("profile", "sector", sections);

		expect(result).toEqual(expectedResult);
	});

	const financialsReaders: {
		block: BlockKey;
		statement: string;
		tables: StatementTable[];
		keys?: LineKey[];
	}[] = [
		{
			block: "incomeChart",
			statement: "annual income",
			tables: [statements.income.annual],
			keys: ["revenue", "netIncome"],
		},
		{
			block: "incomeTable",
			statement: "income",
			tables: [statements.income.annual, statements.income.quarterly],
		},
		{
			block: "balanceChart",
			statement: "annual balance",
			tables: [statements.balance.annual],
			keys: ["totalAssets", "totalLiabilities", "shareholdersEquity"],
		},
		{
			block: "balanceTable",
			statement: "balance",
			tables: [statements.balance.annual, statements.balance.quarterly],
		},
		{
			block: "cashFlowChart",
			statement: "annual cash flow",
			tables: [statements.cashFlow.annual],
			keys: ["operatingCashFlow", "capitalExpenditure", "shareRepurchases"],
		},
		{
			block: "cashFlowTable",
			statement: "cash flow",
			tables: [statements.cashFlow.annual, statements.cashFlow.quarterly],
		},
	];

	it.each(financialsReaders)(
		"should read the $statement statement when the $block block is read",
		({ block, tables, keys }) => {
			const expectedResult = claimsIn(tables, keys);

			const result = claimsOf(block, "company", sections);

			expect(result).toEqual(expectedResult);
		},
	);

	it("should return no claim when the section of the block has not loaded", () => {
		const unloaded = completeSections({ ...fakeCompanyReport, overview: null });

		const expectedResult: Claim[] = [];

		const result = claimsOf("profile", "company", unloaded);

		expect(result).toEqual(expectedResult);
	});
});

describe("figureGroupsOf", () => {
	// TODO(STA-229): no company group of Overview reads a `SectorBenchmark`
	// field until `evaluateMetric` exists, so this test cannot fail before then.
	it("should hold no sector benchmark claim when a company group of Overview is built", () => {
		const expectedResult: string[] = [];

		const result = figureGroupsOf("overview", sections)
			.filter(({ ref }) => !isSectorBenchmark(ref))
			.flatMap(({ claims }) => claims.map(({ id }) => id))
			.filter((id) => id.startsWith("overview.sectorBenchmarks."));

		expect(result).toEqual(expectedResult);
	});

	it("should give one group of each kind when a block draws sector figures", () => {
		const expectedResult = ["company", "sector"];

		const result = figureGroupsOf("overview", sections)
			.filter(({ ref }) => ref.block === "keyFigures")
			.map(({ ref }) => ref.figures);

		expect(result).toEqual(expectedResult);
	});

	it("should give a group for each loaded block when the Overview tab is read", () => {
		const expectedResult = [
			"business",
			"tenYears",
			"keyFigures",
			"keyFigures",
			"financialPosition",
			"checksByArea",
			"ownership",
			"profile",
			"printedShareholderReturns",
		];

		const result = figureGroupsOf("overview", sections).map(
			({ ref }) => ref.block,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give a group for each block when the Financials tab is read", () => {
		const expectedResult = [
			"incomeChart",
			"incomeTable",
			"balanceChart",
			"balanceTable",
			"cashFlowChart",
			"cashFlowTable",
		];

		const result = figureGroupsOf("financials", sections).map(
			({ ref }) => ref.block,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read the shares outstanding and each fund's two 13F counts when the Largest Funds group is built", () => {
		const expectedResult = [
			"relationships.ownership.sharesOutstanding",
			"relationships.funds.0.shares",
			"relationships.funds.0.sharesQuarterEarlier",
			"relationships.funds.1.shares",
			"relationships.funds.1.sharesQuarterEarlier",
		];

		const result = claimsOf("largestFunds", "company", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read each ratio now and its own range and median when the company group of card 3.1 is built", () => {
		const expectedResult = ratioRanges(sections)
			.flatMap(({ now, ownLow, ownMedian, ownHigh }) => [
				now,
				ownLow,
				ownMedian,
				ownHigh,
			])
			.map((figure) => claim(figure).id);

		const result = claimsOf("valuationRatios", "company", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read the three quartiles of the four Valuation ratios when the sector group of card 3.1 is built", () => {
		const expectedResult = valuation.sectorBenchmarks
			.filter(({ metric }) => ratios.has(metric))
			.flatMap((row) => [row.lowerQuartile, row.median, row.upperQuartile])
			.map((figure) => claim(figure).id);

		const result = claimsOf("valuationRatios", "sector", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give a company group and a sector group when the Valuation tab is read", () => {
		const expectedResult = ["company", "sector"];

		const result = figureGroupsOf("valuation", sections).map(
			({ ref }) => ref.figures,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give no Valuation group when the masthead has not loaded", () => {
		const withoutMasthead = completeSections({
			...fakeCompanyReport,
			masthead: null,
		});

		const expectedResult: FigureGroup[] = [];

		const result = figureGroupsOf("valuation", withoutMasthead);

		expect(result).toEqual(expectedResult);
	});

	it("should read the counts of the listed funds only when there are more funds than LISTED_FUNDS", () => {
		const { relationships } = fakeCompanyReport;
		const [harlow] = relationships.funds;
		const manyFunds = completeSections({
			...fakeCompanyReport,
			relationships: {
				...relationships,
				funds: Array.from({ length: LISTED_FUNDS + 5 }, () => harlow),
			},
		});

		const expectedResult = 1 + 2 * LISTED_FUNDS;

		const result = claimsOf("largestFunds", "company", manyFunds).length;

		expect(result).toBe(expectedResult);
	});

	it("should read each insider's latest Form 4 count when the Insiders group is built", () => {
		const expectedResult = [
			"relationships.insiders.0.shares",
			"relationships.insiders.1.shares",
			"relationships.insiders.2.shares",
		];

		const result = claimsOf("insiders", "company", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read the three drawn shares when the Ownership Split group is built", () => {
		const expectedResult = [
			"metric.ownershipShares.relationships.institutions",
			"metric.ownershipShares.relationships.insiders",
			"metric.ownershipShares.relationships.public",
		];

		const result = claimsOf("ownershipSplit", "company", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read each subsidiary's jurisdiction when the Subsidiaries group is built", () => {
		const expectedResult = [
			"relationships.subsidiaries.0.jurisdiction",
			"relationships.subsidiaries.1.jurisdiction",
		];

		const result = claimsOf("subsidiaries", "company", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read the shares held and the shares outstanding of each row when the Stakes group is built", () => {
		const expectedResult = [
			"relationships.stakes.0.sharesHeld",
			"relationships.stakes.0.sharesOutstanding",
			"relationships.stakes.1.sharesHeld",
			"relationships.stakes.1.sharesOutstanding",
		];

		const result = claimsOf("stakes", "company", sections).map(({ id }) => id);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the shares outstanding of a stake when its shares held are missing", () => {
		const { relationships } = fakeCompanyReport;
		const partial = completeSections({
			...fakeCompanyReport,
			relationships: {
				...relationships,
				stakes: relationships.stakes.map((row, position) =>
					position === 0 ? { ...row, sharesHeld: null } : row,
				),
			},
		});

		const expectedResult = true;

		const result = claimsOf("stakes", "company", partial).some(
			({ id }) => id === "relationships.stakes.0.sharesOutstanding",
		);

		expect(result).toBe(expectedResult);
	});

	it("should read each person's start and independence when the Executives and Board group is built", () => {
		const expectedResult = [
			"management.people.0.since",
			"management.people.0.independence",
			"management.people.1.since",
			"management.people.1.independence",
		];

		const result = claimsOf("executivesAndBoard", "company", sections).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the DEF 14A of a person in the sources when their tenure cannot be computed", () => {
		const { management } = fakeCompanyReport;
		const [first] = management.people;
		// A start after the filing date gives no tenure, and the person has no independence claim.
		const since = { ...claim(first.since), value: "2030-01-01" };
		const people = [{ ...first, since, independence: null }];
		const partial = completeSections({
			...fakeCompanyReport,
			management: { ...management, people },
		});

		const expectedResult = { tenure: null, filings: ["0001999999-25-000014"] };

		const result = {
			tenure: tenure({ ...management, people }, 0),
			filings: sourcesOf(
				claimsOf("executivesAndBoard", "company", partial),
			).groups.map(({ document }) =>
				document.kind === "filing" ? document.accessionNumber : document.name,
			),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should drop the blocks that read the financials when Overview loads without them", () => {
		const partial = completeSections({
			...fakeCompanyReport,
			financials: null,
		});

		// Key Figures keeps only its sector group: its company figures read Financials.
		const expectedResult = [
			"business",
			"keyFigures",
			"ownership",
			"profile",
			"printedShareholderReturns",
		];

		const result = figureGroupsOf("overview", partial).map(
			({ ref }) => ref.block,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give no group when a tab has no blocks", () => {
		const expectedResult: FigureGroup[] = [];

		const result = figureGroupsOf("filings", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should give no group when the section of the tab has not loaded", () => {
		const unloaded = completeSections({
			...fakeCompanyReport,
			financials: null,
		});

		const expectedResult: FigureGroup[] = [];

		const result = figureGroupsOf("financials", unloaded);

		expect(result).toEqual(expectedResult);
	});

	it("should name only the company's filer when sourcesOf reads the company groups of Overview", () => {
		const claims = figureGroupsOf("overview", sections)
			.filter(({ ref }) => !isSectorBenchmark(ref))
			.flatMap((group) => group.claims);

		const expectedResult = ["Quillvane Instruments, Inc."];

		const result = [
			...new Set(
				sourcesOf(claims).groups.flatMap(({ document }) =>
					document.kind === "filing" ? [document.filer] : [],
				),
			),
		];

		expect(result).toEqual(expectedResult);
	});
});

describe("isSectorBenchmark", () => {
	it("should read the kind of figures when two refs share a block and a label", () => {
		const ref: FigureGroupRef = {
			tab: "overview",
			block: "keyFigures",
			label: "Key Figures",
			figures: "company",
		};

		const expectedResult = [false, true];

		const result = [
			isSectorBenchmark(ref),
			isSectorBenchmark({ ...ref, figures: "sector" }),
		];

		expect(result).toEqual(expectedResult);
	});
});

describe("isPrintedOnly", () => {
	it("should read the block and not the label when a ref names the printed shareholder returns", () => {
		const ref: FigureGroupRef = {
			tab: "overview",
			block: "profile",
			label: "Shareholder returns, printed page",
			figures: "company",
		};

		const expectedResult = [false, true];

		const result = [
			isPrintedOnly(ref),
			isPrintedOnly({ ...ref, block: "printedShareholderReturns" }),
		];

		expect(result).toEqual(expectedResult);
	});
});

describe("sourcesOf", () => {
	it("should put newer filings first and market data last when claims reach both", () => {
		const claims = [derived("metric.made.up", [price, revenue2016, eps2025])];

		const expectedResult = [
			TEN_K_2025,
			"0001999999-17-000003",
			"End-of-day prices, NASDAQ",
		];

		const result = documentIds(claims);

		expect(result).toEqual(expectedResult);
	});

	it("should hold a shared claim once when two trees reach it", () => {
		const claims = [
			derived("metric.first", [eps2025]),
			derived("metric.second", [eps2025]),
		];

		const expectedResult = [[eps2025]];

		const result = sourcesOf(claims).groups.map((group) => group.claims);

		expect(result).toEqual(expectedResult);
	});

	it("should end the walk when a defect builds a cycle", () => {
		const inputs: [Claim, ...Claim[]] = [eps2025];
		const loop = derived("metric.loop", inputs);
		inputs.push(loop);

		const expectedResult = [TEN_K_2025];

		const result = documentIds([loop]);

		expect(result).toEqual(expectedResult);
	});
});

describe("feedsOf", () => {
	const checks: FigureGroupRef = {
		tab: "overview",
		block: "checksByArea",
		label: "Checks by Area",
		figures: "company",
	};
	const income: FigureGroupRef = {
		tab: "financials",
		block: "incomeTable",
		label: "Income statement table",
		figures: "company",
	};
	const proxy: Filing = {
		...filingOf(eps2025),
		form: "DEF 14A",
		accessionNumber: "0001999999-26-000040",
	};
	const pay: Claim = {
		...eps2025,
		id: "management.ceoPay.salary.FY2025",
		source: {
			kind: "reported",
			document: proxy,
			line: "Summary compensation table › Salary",
			xbrlTag: null,
			url: proxy.indexUrl,
		},
	};

	it("should list the groups that reach the 10-K when the note §7 Filings row is built", () => {
		const groups: FigureGroup[] = [
			{
				ref: checks,
				claims: [derived("metric.priceToEarnings", [price, eps2025])],
			},
			{ ref: income, claims: claimsOf("incomeTable", "company", sections) },
			{
				ref: { ...checks, block: "profile", label: "Profile" },
				claims: [pay],
			},
		];

		const expectedResult = [checks, income];

		const result = feedsOf(groups).get(TEN_K_2025);

		expect(result).toEqual(expectedResult);
	});

	it("should give no entry when a group reaches market data only", () => {
		const expectedResult = 0;

		const result = feedsOf([{ ref: checks, claims: [price] }]).size;

		expect(result).toEqual(expectedResult);
	});
});
