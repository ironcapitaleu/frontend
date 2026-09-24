import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { completeSections } from "./metrics";
import {
	claimsOf,
	feedsOf,
	figureGroupsOf,
	isSectorBenchmark,
	sourcesOf,
} from "./sources";
import type { Claim, Filing, FigureGroup, FigureGroupRef } from "./types";

const sections = completeSections(fakeCompanyReport);

const { masthead, overview, financials } = fakeCompanyReport;

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

/** Returns the ids of the documents of `sourcesOf(claims)`, in order. */
function documentIds(claims: Claim[]): string[] {
	return sourcesOf(claims).groups.map(({ document }) =>
		document.kind === "filing" ? document.accessionNumber : document.name,
	);
}

describe("claimsOf", () => {
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

	it("should hold only sector benchmark claims when the sector figures of Key Figures are read", () => {
		const expectedResult = overview.sectorBenchmarks.map(({ median }) =>
			claim(median),
		);

		const result = claimsOf("keyFigures", "sector", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should return no claim when the section of the block has not loaded", () => {
		const unloaded = completeSections({ ...fakeCompanyReport, overview: null });

		const expectedResult: Claim[] = [];

		const result = claimsOf("profile", "company", unloaded);

		expect(result).toEqual(expectedResult);
	});
});

describe("figureGroupsOf", () => {
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
		];

		const result = figureGroupsOf("overview", sections).map(
			({ ref }) => ref.block,
		);

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
