import { describe, expect, it } from "vitest";

import { Ticker } from "../domain/ticker";
import { MissingCompany } from "./errors";
import { completeSections } from "./metrics";
import { meridianFilingsSection } from "./sample/filings";
import { meridianFinancials } from "./sample/financials";
import { fiscalYearOf } from "./sample/calendar";
import { meridianManagement } from "./sample/management";
import { meridianMasthead } from "./sample/masthead";
import { meridianOverview } from "./sample/overview";
import { meridianRelationships } from "./sample/relationships";
import { meridianShareholderReturns } from "./sample/shareholderReturns";
import {
	MERIDIAN,
	MissingSampleData,
	meridianFilings,
	nasdaqPrices,
	proxy,
	tenK,
} from "./sample/sources";
import { meridianValuation, treasuryYields } from "./sample/valuation";
import { sampleCompanyGateway } from "./sampleCompanyGateway";
import { figureGroupsOf, sourcesOf } from "./sources";
import type {
	Claim,
	LineKey,
	Period,
	StatementLine,
	StatementTable,
} from "./types";

const MRDN = Ticker.parse("MRDN");
const AAPL = Ticker.parse("AAPL");
const SECTIONS = [
	meridianMasthead,
	meridianOverview,
	meridianFinancials,
	meridianValuation,
	meridianShareholderReturns,
	meridianRelationships,
	meridianManagement,
];
const STATEMENTS = {
	income: meridianFinancials.income,
	balance: meridianFinancials.balance,
	cashFlow: meridianFinancials.cashFlow,
};
const TABLES = Object.values(STATEMENTS).flatMap((statement) =>
	[statement.annual, statement.quarterly, statement.yearToDate].filter(
		(table): table is StatementTable => table !== null,
	),
);

function isClaim(value: object): value is Claim {
	return "id" in value && "source" in value;
}

/** Collects every value under `value`, walking into objects, arrays and derived inputs. */
function everyValue(value: unknown): unknown[] {
	if (value === null || typeof value !== "object") {
		return [value];
	}
	return [value, ...Object.values(value).flatMap(everyValue)];
}

function everyClaim(): Claim[] {
	const claims = everyValue(SECTIONS).filter(
		(value): value is Claim =>
			typeof value === "object" && value !== null && isClaim(value),
	);
	return [...new Set(claims)];
}

/** Returns every accession number that `value` names, in order. */
function accessionNumbersOf(value: unknown): string[] {
	const text = JSON.stringify(value);
	return [...text.matchAll(/"accessionNumber":"([^"]*)"/g)].map(
		([, accessionNumber]) => accessionNumber,
	);
}

/**
 * Returns the company claims under `value`. It stops at each claim, and it
 * skips the `sectorBenchmarks` lists, because the Filings walk skips the
 * sector figures (`isSectorBenchmark`).
 */
function companyClaimsOf(value: unknown): Claim[] {
	if (value === null || typeof value !== "object") {
		return [];
	}
	if (isClaim(value)) {
		return [value];
	}
	return Object.entries(value).flatMap(([key, child]) =>
		key === "sectorBenchmarks" ? [] : companyClaimsOf(child),
	);
}

function label(period: Period): string {
	return period.fiscalQuarter === null
		? `FY${period.fiscalYear}`
		: `Q${period.fiscalQuarter} FY${period.fiscalYear}`;
}

function lineOf(table: StatementTable, key: LineKey): StatementLine {
	const line = table.lines.find((each) => each.key === key);
	if (line === undefined) {
		throw new MissingSampleData(`the ${key} line`);
	}
	return line;
}

function yearToDateOf(statement: "income" | "cashFlow"): StatementTable {
	const table = STATEMENTS[statement].yearToDate;
	if (table === null) {
		throw new MissingSampleData(`the ${statement} year-to-date table`);
	}
	return table;
}

function valueAt(table: StatementTable, key: LineKey, at: string): number {
	const line = lineOf(table, key);
	const position = line.periods.findIndex((period) => label(period) === at);
	return Number(line.points[position]?.value);
}

/** The fourth quarter that a fiscal year leaves after its nine-month figure. */
function derivedFourthQuarter(
	key: LineKey,
	year: number,
	statement: "income" | "cashFlow",
): number {
	return (
		valueAt(STATEMENTS[statement].annual, key, `FY${year}`) -
		valueAt(yearToDateOf(statement), key, `Q3 FY${year}`)
	);
}

describe("sampleCompanyGateway", () => {
	it("should resolve the MRDN masthead when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianMasthead;

		const result = await gateway.getMasthead(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should resolve the MRDN overview when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianOverview;

		const result = await gateway.getOverview(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should resolve the MRDN financials when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianFinancials;

		const result = await gateway.getFinancials(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should resolve the MRDN valuation when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianValuation;

		const result = await gateway.getValuation(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should reject the valuation with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getValuation(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should resolve the MRDN shareholder returns when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianShareholderReturns;

		const result = await gateway.getShareholderReturns(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should reject the shareholder returns with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getShareholderReturns(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should resolve the MRDN relationships when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianRelationships;

		const result = await gateway.getRelationships(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should reject the relationships with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getRelationships(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should resolve the MRDN management when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianManagement;

		const result = await gateway.getManagement(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should reject the management with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getManagement(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should resolve the MRDN filings when the ticker is MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianFilingsSection;

		const result = await gateway.getFilings(MRDN);

		expect(result).toBe(expectedResult);
	});

	it("should reject the filings with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getFilings(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should resolve the masthead when the ticker is a new MRDN value parsed from lower case", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = meridianMasthead;

		const result = await gateway.getMasthead(Ticker.parse(" mrdn "));

		expect(result).toBe(expectedResult);
	});

	it("should reject the masthead with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getMasthead(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should reject the overview with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getOverview(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});

	it("should reject the financials with MissingCompany when the ticker is not MRDN", async () => {
		const gateway = sampleCompanyGateway();

		const expectedResult = new MissingCompany(AAPL);

		const result = gateway.getFinancials(AAPL);

		await expect(result).rejects.toEqual(expectedResult);
	});
});

describe("the MRDN sample data", () => {
	it("should cover FY2017 to FY2026 when reading the annual table of each statement", () => {
		const years = Array.from({ length: 10 }, (_, row) => `FY${2017 + row}`);

		const expectedResult = { income: years, balance: years, cashFlow: years };

		const result = Object.fromEntries(
			Object.entries(STATEMENTS).map(([key, statement]) => [
				key,
				statement.annual.periods.map(label),
			]),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should cover Q3 FY2025 to Q2 FY2027 when reading the quarterly table of each statement", () => {
		const quarters = [
			"Q3 FY2025",
			"Q4 FY2025",
			"Q1 FY2026",
			"Q2 FY2026",
			"Q3 FY2026",
			"Q4 FY2026",
			"Q1 FY2027",
			"Q2 FY2027",
		];

		const expectedResult = {
			income: quarters,
			balance: quarters,
			cashFlow: quarters,
		};

		const result = Object.fromEntries(
			Object.entries(STATEMENTS).map(([key, statement]) => [
				key,
				statement.quarterly.periods.map(label),
			]),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should cover the six and nine months of each fiscal year in the window when reading the year-to-date tables", () => {
		const quarters = [
			"Q2 FY2025",
			"Q3 FY2025",
			"Q2 FY2026",
			"Q3 FY2026",
			"Q2 FY2027",
		];

		const expectedResult = { income: quarters, cashFlow: quarters };

		const result = {
			income: yearToDateOf("income").periods.map(label),
			cashFlow: yearToDateOf("cashFlow").periods.map(label),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should leave the balance sheet without a year-to-date table when reading the three statements", () => {
		const expectedResult = { income: true, balance: false, cashFlow: true };

		const result = Object.fromEntries(
			Object.entries(STATEMENTS).map(([key, statement]) => [
				key,
				statement.yearToDate !== null,
			]),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give every line the periods of its table when reading every table", () => {
		const expectedResult: string[] = [];

		const result = TABLES.flatMap((table) =>
			table.lines
				.filter((line) => line.periods !== table.periods)
				.map((line) => line.key),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should leave null only the quarters that no 10-Q reports when reading the quarterly tables", () => {
		const expectedResult = {
			income: ["Q4 FY2025", "Q4 FY2026"],
			balance: [],
			cashFlow: [
				"Q3 FY2025",
				"Q4 FY2025",
				"Q2 FY2026",
				"Q3 FY2026",
				"Q4 FY2026",
				"Q2 FY2027",
			],
		};

		const result = Object.fromEntries(
			Object.entries(STATEMENTS).map(([key, { quarterly }]) => [
				key,
				quarterly.periods
					.filter((_, position) =>
						quarterly.lines.some((line) => line.points[position] === null),
					)
					.map(label),
			]),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give each claim its own id when reading every section", () => {
		const expectedResult: string[] = [];

		const claims = new Set(
			everyValue(SECTIONS).filter(
				(value): value is Claim =>
					typeof value === "object" && value !== null && isClaim(value),
			),
		);
		const ids = [...claims].map((claim) => claim.id);
		const result = ids.filter((id, position) => ids.indexOf(id) !== position);

		expect(result).toEqual(expectedResult);
	});

	it("should mint claim ids by the period rules of the data model when reading two statement figures", () => {
		const expectedResult = [
			"financials.revenue.FY2026",
			"financials.shareholdersEquity.Q4-2026-01-25",
		];

		const result = [
			lineOf(meridianFinancials.income.annual, "revenue").points[9]?.id,
			lineOf(meridianFinancials.balance.quarterly, "shareholdersEquity")
				.points[5]?.id,
		];

		expect(result).toEqual(expectedResult);
	});

	it("should give every reported statement source a form, filing date, line, XBRL tag and link when reading the financials", () => {
		const expectedResult: string[] = [];

		const result = everyClaim()
			.filter(
				(claim) =>
					claim.id.startsWith("financials.") &&
					!(
						claim.source.kind === "reported" &&
						claim.source.document.kind === "filing" &&
						claim.source.document.form &&
						claim.source.document.filedOn &&
						claim.source.line &&
						claim.source.xbrlTag &&
						claim.source.url
					),
			)
			.map((claim) => claim.id);

		expect(result).toEqual(expectedResult);
	});

	it("should give every reported source a document, a line and a link when reading every section", () => {
		const expectedResult: string[] = [];

		const result = everyClaim()
			.filter(
				(claim) =>
					claim.source.kind === "reported" &&
					!(claim.source.document && claim.source.line && claim.source.url),
			)
			.map((claim) => claim.id);

		expect(result).toEqual(expectedResult);
	});

	it("should give every derived source a formula and at least one input when reading every section", () => {
		const expectedResult: string[] = [];

		const result = everyClaim()
			.filter(
				(claim) =>
					claim.source.kind === "derived" &&
					!(claim.source.formula && claim.source.inputs.length > 0),
			)
			.map((claim) => claim.id);

		expect(result).toEqual(expectedResult);
	});

	it("should use the reserved .example domain when reading every link", () => {
		const expectedResult: string[] = [];

		const result = everyValue(SECTIONS)
			.filter(
				(value): value is string =>
					typeof value === "string" && value.startsWith("http"),
			)
			.filter((link) => !new URL(link).hostname.endsWith(".example"));

		expect(result).toEqual(expectedResult);
	});

	it("should link each filing into the EDGAR folder of its filer when reading every reported source", () => {
		const expectedResult: string[] = [];

		const result = everyClaim()
			.filter(
				({ source }) =>
					source.kind === "reported" &&
					source.document.kind === "filing" &&
					!source.url.startsWith(
						`https://edgar.example/Archives/edgar/data/${Number(source.document.accessionNumber.slice(0, 10))}/`,
					),
			)
			.map((claim) => claim.id);

		expect(result).toEqual(expectedResult);
	});

	it("should name a document after MRDN only when Meridian filed it when reading every reported source", () => {
		const expectedResult: string[] = [];

		const result = everyClaim()
			.filter(
				({ source }) =>
					source.kind === "reported" &&
					source.document.kind === "filing" &&
					source.url.includes("/mrdn-") !==
						(source.document.filer === MERIDIAN),
			)
			.map((claim) => claim.id);

		expect(result).toEqual(expectedResult);
	});

	it("should print the filing date as the period of each Form 4 when reading the Overview insider holdings", () => {
		const expectedResult = [
			"18 Jun 2026",
			"21 Apr 2026",
			"2 Jun 2026",
			"14 Mar 2026",
			"14 Mar 2026",
			"2 Jun 2026",
		];

		const result = everyClaim()
			.filter((claim) => claim.id.startsWith("overview."))
			.flatMap(({ source }) =>
				source.kind === "reported" &&
				source.document.kind === "filing" &&
				source.document.form === "Form 4"
					? [source.document.periodLabel]
					: [],
			);

		expect(result).toEqual(expectedResult);
	});

	it("should throw MissingSampleData when the sample data has no 10-K for the fiscal year", () => {
		const expectedResult = new MissingSampleData("the 10-K of FY2010");

		const result = () => tenK(2010);

		expect(result).toThrow(expectedResult);
	});

	it("should throw MissingSampleData when the sample data has no proxy statement for the year", () => {
		const expectedResult = new MissingSampleData("the DEF 14A of 2010");

		const result = () => proxy(2010);

		expect(result).toThrow(expectedResult);
	});

	it("should add up to the FY2026 revenue when summing the segment revenues", () => {
		const expectedResult = valueAt(
			meridianFinancials.income.annual,
			"revenue",
			"FY2026",
		);

		const result = meridianOverview.segments.reduce(
			(sum, part) => sum + Number(part.revenue?.value),
			0,
		);

		expect(result).toBe(expectedResult);
	});

	it("should add up to the FY2026 revenue when summing the region revenues", () => {
		const expectedResult = valueAt(
			meridianFinancials.income.annual,
			"revenue",
			"FY2026",
		);

		const result = meridianOverview.regions.reduce(
			(sum, part) => sum + Number(part.revenue?.value),
			0,
		);

		expect(result).toBe(expectedResult);
	});

	it("should make total assets equal liabilities plus equity when reading every balance sheet period", () => {
		const { annual, quarterly } = meridianFinancials.balance;

		const expectedResult: string[] = [];

		const result = [annual, quarterly].flatMap((table) =>
			table.periods
				.filter((period) => {
					const at = label(period);
					return (
						valueAt(table, "totalAssets", at) !==
						valueAt(table, "totalLiabilities", at) +
							valueAt(table, "shareholdersEquity", at)
					);
				})
				.map(label),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should equal the sum of the three reported quarters when reading each FY2026 nine-month figure", () => {
		const flowLines: LineKey[] = ["revenue", "operatingIncome", "netIncome"];
		const { quarterly } = meridianFinancials.income;

		const expectedResult: string[] = [];

		const result = flowLines.filter(
			(key) =>
				valueAt(yearToDateOf("income"), key, "Q3 FY2026") !==
				[1, 2, 3].reduce(
					(sum, quarter) => sum + valueAt(quarterly, key, `Q${quarter} FY2026`),
					0,
				),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should leave the FY2026 fourth quarter when subtracting the nine-month figure from the fiscal year", () => {
		const expectedResult = {
			revenue: 64_200_000_000,
			netIncome: 40_913_000_000,
			operatingCashFlow: 37_217_000_000,
		};

		const result = {
			revenue: derivedFourthQuarter("revenue", 2026, "income"),
			netIncome: derivedFourthQuarter("netIncome", 2026, "income"),
			operatingCashFlow: derivedFourthQuarter(
				"operatingCashFlow",
				2026,
				"cashFlow",
			),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should leave a positive fourth quarter for every flow line when subtracting the nine-month figure from the fiscal year", () => {
		const flowLines: [LineKey, "income" | "cashFlow"][] = [
			["revenue", "income"],
			["operatingIncome", "income"],
			["netIncome", "income"],
			...meridianFinancials.cashFlow.annual.lines.map(
				(line): [LineKey, "cashFlow"] => [line.key, "cashFlow"],
			),
		];

		const expectedResult: string[] = [];

		const result = flowLines.flatMap(([key, statement]) =>
			[2025, 2026]
				.filter((year) => !(derivedFourthQuarter(key, year, statement) > 0))
				.map((year) => `${key} FY${year}`),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep dividends paid below free cash flow when reading every fiscal year", () => {
		const annual = meridianFinancials.cashFlow.annual;

		const expectedResult: string[] = [];

		const result = annual.periods
			.map(label)
			.filter(
				(year) =>
					valueAt(annual, "dividendsPaid", year) >=
					valueAt(annual, "operatingCashFlow", year) -
						valueAt(annual, "capitalExpenditure", year),
			);

		expect(result).toEqual(expectedResult);
	});

	it("should hold the four Overview benchmarks when reading the sector benchmarks", () => {
		const expectedResult = [
			"operatingMargin",
			"returnOnEquity",
			"dividendYield",
			"buybackYield",
		];

		const result = meridianOverview.sectorBenchmarks.map(
			(benchmark) => benchmark.metric,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give each sector median the middle peer figure when reading every benchmark", () => {
		const expectedResult: string[] = [];

		const result = meridianOverview.sectorBenchmarks
			.filter(({ median, peerCount }) => {
				if (median?.source.kind !== "derived") {
					return true;
				}
				const peers = median.source.inputs
					.map((peer) => Number(peer.value))
					.sort((first, second) => first - second);
				return (
					peers.length !== peerCount ||
					peers[(peerCount - 1) / 2] !== median.value
				);
			})
			.map((benchmark) => benchmark.metric);

		expect(result).toEqual(expectedResult);
	});

	it("should set the ownership date from the 13F totals when reading the ownership summary", () => {
		const { ownership } = meridianOverview;

		const expectedResult = ownership.institutionShares?.period?.endsOn;

		const result = ownership.asOf;

		expect(result).toBe(expectedResult);
	});

	it("should hold the mock-up figures when reading the reported MRDN figures", () => {
		const { income, balance } = meridianFinancials;

		const expectedResult = {
			price: 210.6,
			dilutedEpsFY2026: 5.51,
			revenueFY2026: 212_000_000_000,
			dilutedSharesQ2FY2027: 24_500_000_000,
			equityQ2FY2027: 180_000_000_000,
			cashQ2FY2027: 62_500_000_000,
			totalAssetsQ2FY2027: 228_800_000_000,
			institutionShares: 16_100_000_000,
		};

		const result = {
			price: meridianMasthead.price?.value,
			dilutedEpsFY2026: valueAt(income.annual, "dilutedEps", "FY2026"),
			revenueFY2026: valueAt(income.annual, "revenue", "FY2026"),
			dilutedSharesQ2FY2027: valueAt(
				income.quarterly,
				"dilutedShares",
				"Q2 FY2027",
			),
			equityQ2FY2027: valueAt(
				balance.quarterly,
				"shareholdersEquity",
				"Q2 FY2027",
			),
			cashQ2FY2027: valueAt(
				balance.quarterly,
				"cashAndShortTermInvestments",
				"Q2 FY2027",
			),
			totalAssetsQ2FY2027: valueAt(
				balance.quarterly,
				"totalAssets",
				"Q2 FY2027",
			),
			institutionShares: meridianOverview.ownership.institutionShares?.value,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should give the mock-up ratios at its rounding when deriving them from the reported figures", () => {
		const { income, balance } = meridianFinancials;
		const revenue = valueAt(income.annual, "revenue", "FY2026");
		const netIncome = valueAt(income.annual, "netIncome", "FY2026");
		const price = Number(meridianMasthead.price?.value);
		const shares = valueAt(income.quarterly, "dilutedShares", "Q2 FY2027");

		const expectedResult = {
			operatingMargin: "64%",
			returnOnEquity: "75%",
			priceToEarnings: "38.2",
			marketCap: "5.16",
		};

		const result = {
			operatingMargin: `${Math.round((valueAt(income.annual, "operatingIncome", "FY2026") / revenue) * 100)}%`,
			returnOnEquity: `${Math.round((netIncome / valueAt(balance.quarterly, "shareholdersEquity", "Q2 FY2027")) * 100)}%`,
			priceToEarnings: (
				price / valueAt(income.annual, "dilutedEps", "FY2026")
			).toFixed(1),
			marketCap: ((price * shares) / 1e12).toFixed(2),
		};

		expect(result).toEqual(expectedResult);
	});
});

describe("the MRDN valuation sample data", () => {
	it("should give the Treasury series the periods of the year-end price series when pairing a yield with a price", () => {
		const expectedResult = meridianMasthead.priceAtFiscalYearEnds.periods;

		const result = meridianValuation.treasuryYieldAtFiscalYearEnds.points.map(
			(point) => point?.period,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should hold the mock-up yields when reading the Treasury yields in percent", () => {
		const expectedResult = {
			yearEnds: [2.45, 2.72, 2.63, 1.51, 1.11, 1.78, 3.52, 4.14, 4.54, 4.24],
			now: 4.1,
		};

		const result = {
			yearEnds: meridianValuation.treasuryYieldAtFiscalYearEnds.points.map(
				(point) => Math.round(Number(point?.value) * 10_000) / 100,
			),
			now:
				Math.round(Number(meridianValuation.treasuryYieldNow?.value) * 10_000) /
				100,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should date the latest Treasury yield on the day of the latest price when reading the yield now", () => {
		const expectedResult = meridianMasthead.price?.period;

		const result = meridianValuation.treasuryYieldNow?.period;

		expect(result).toEqual(expectedResult);
	});

	it("should hold the four valuation ratios when reading the sector benchmarks", () => {
		const expectedResult = [
			"priceToEarnings",
			"priceToFreeCashFlow",
			"priceToBook",
			"enterpriseValueToEbit",
		];

		const result = meridianValuation.sectorBenchmarks.map(
			(benchmark) => benchmark.metric,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should share no metric with the Overview benchmarks when reading both benchmark lists", () => {
		const overview = meridianOverview.sectorBenchmarks.map(
			(benchmark) => benchmark.metric,
		);

		const expectedResult: string[] = [];

		const result = meridianValuation.sectorBenchmarks
			.map((benchmark) => benchmark.metric)
			.filter((metric) => overview.includes(metric));

		expect(result).toEqual(expectedResult);
	});

	it("should hold the mock-up quartiles when reading each valuation ratio", () => {
		const expectedResult = [
			[22.6, 31.4, 44],
			[24.1, 35.2, 51.3],
			[2.9, 5.1, 9.8],
			[18.5, 26.8, 38.9],
		];

		const result = meridianValuation.sectorBenchmarks.map((benchmark) =>
			[benchmark.lowerQuartile, benchmark.median, benchmark.upperQuartile].map(
				(quartile) => quartile?.value,
			),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read the same peer filings as the Overview when comparing the peers of the two benchmark lists", () => {
		const accessions = (median: Claim | null) =>
			median?.source.kind === "derived"
				? median.source.inputs.map((peer) =>
						peer.source.kind === "reported" &&
						peer.source.document.kind === "filing"
							? peer.source.document.accessionNumber
							: null,
					)
				: [];

		const expectedResult = accessions(
			meridianOverview.sectorBenchmarks[0].median,
		);

		const result = accessions(meridianValuation.sectorBenchmarks[0].median);

		expect(result).toEqual(expectedResult);
	});
});

describe("the MRDN shareholder returns sample data", () => {
	const { annual } = meridianFinancials.cashFlow;
	const years = annual.periods.map((period) => label(period));
	const pointValue = (
		series: { points: readonly (Claim | null)[] },
		row: number,
	) => Number(series.points[row]?.value);

	it("should cover the fiscal years of the annual tables when reading each series", () => {
		const { dividendPerShare, sharesRepurchased, sharesIssuedToStaff } =
			meridianShareholderReturns;

		const expectedResult = [years, years, years];

		const result = [
			dividendPerShare,
			sharesRepurchased,
			sharesIssuedToStaff,
		].map((series) => series.periods.map((period) => label(period)));

		expect(result).toEqual(expectedResult);
	});

	it("should keep dividends paid within 1% of the dividend per share times the diluted shares when reading every fiscal year", () => {
		const { dividendPerShare } = meridianShareholderReturns;

		const expectedResult: string[] = [];

		const result = years.filter((year, row) => {
			const paid = valueAt(annual, "dividendsPaid", year);
			const declared =
				pointValue(dividendPerShare, row) *
				valueAt(meridianFinancials.income.annual, "dilutedShares", year);
			return Math.abs(paid - declared) > paid * 0.01;
		});

		expect(result).toEqual(expectedResult);
	});

	it("should buy back shares worth the cash flow repurchases within 1% when pricing them at the mean of the year-end prices around the year", () => {
		const { sharesRepurchased } = meridianShareholderReturns;
		const prices = meridianMasthead.priceAtFiscalYearEnds.points.map((point) =>
			Number(point?.value),
		);

		const expectedResult: string[] = [];

		const result = years.filter((year, row) => {
			const paid = valueAt(annual, "shareRepurchases", year);
			const around = prices.slice(Math.max(row - 1, 0), row + 1);
			const averagePrice =
				around.reduce((total, price) => total + price, 0) / around.length;
			const bought = pointValue(sharesRepurchased, row) * averagePrice;
			return Math.abs(paid - bought) > paid * 0.01;
		});

		expect(result).toEqual(expectedResult);
	});

	it("should buy back no shares when the cash flow statement reports no repurchases", () => {
		const { sharesRepurchased } = meridianShareholderReturns;

		const expectedResult = ["FY2018", "FY2021", "FY2022"];

		const result = years.filter(
			(_, row) => pointValue(sharesRepurchased, row) === 0,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should equal the fall in diluted shares when netting the shares issued against the shares bought back from FY2018 to FY2026", () => {
		const { sharesRepurchased, sharesIssuedToStaff } =
			meridianShareholderReturns;
		const { income } = meridianFinancials;

		const expectedResult =
			valueAt(income.annual, "dilutedShares", "FY2026") -
			valueAt(income.annual, "dilutedShares", "FY2017");

		const result = years
			.slice(1)
			.reduce(
				(total, _, row) =>
					total +
					pointValue(sharesIssuedToStaff, row + 1) -
					pointValue(sharesRepurchased, row + 1),
				0,
			);

		expect(result).toBe(expectedResult);
	});

	it("should declare a quarter of the FY2026 dividend per share when reading the latest dividend declared", () => {
		const { dividendPerShare, latestDividendDeclared } =
			meridianShareholderReturns;

		const expectedResult = pointValue(dividendPerShare, 9) / 4;

		const result = Number(latestDividendDeclared?.value);

		expect(result).toBeCloseTo(expectedResult, 6);
	});
});

/** Renames the section prefix of every claim id under `value`, to compare two copies of one value. */
describe("the printed MRDN shareholder returns block", () => {
	const sections = {
		masthead: meridianMasthead,
		overview: meridianOverview,
		financials: meridianFinancials,
		valuation: meridianValuation,
		shareholderReturns: meridianShareholderReturns,
		relationships: meridianRelationships,
		management: meridianManagement,
		filings: meridianFilingsSection,
	};
	const printedClaimsOf = (loaded: typeof sections | typeof unloaded) =>
		figureGroupsOf("overview", completeSections(loaded))
			.filter(({ ref }) => ref.block === "printedShareholderReturns")
			.map(({ claims }) => claims.map((claim) => claim.id));
	const unloaded = { ...sections, shareholderReturns: null };

	it("should read the latest dividend per share and the latest dividend declared when the Overview groups are built", () => {
		const { dividendPerShare, latestDividendDeclared } =
			meridianShareholderReturns;

		const expectedResult = [
			[dividendPerShare.points.at(-1)?.id, latestDividendDeclared?.id],
		];

		const result = printedClaimsOf(sections);

		expect(result).toEqual(expectedResult);
	});

	it("should give no printed group when the shareholder returns have not loaded", () => {
		const expectedResult: string[][] = [];

		const result = printedClaimsOf(unloaded);

		expect(result).toEqual(expectedResult);
	});
});

function asSection(value: unknown, from: string, to: string): unknown {
	return JSON.parse(
		JSON.stringify(value).replaceAll(`"id":"${from}.`, `"id":"${to}.`),
	);
}

describe("the MRDN relationships sample data", () => {
	const { ownership, funds, stakes, subsidiaries } = meridianRelationships;

	it("should equal the Overview ownership field by field when the section prefix of the ids is ignored", () => {
		const expectedResult = asSection(
			meridianOverview.ownership,
			"overview",
			"relationships",
		);

		const result = ownership;

		expect(result).toEqual(expectedResult);
	});

	it("should add up to the institution shares when summing the shares of every fund", () => {
		const expectedResult = ownership.institutionShares?.value;

		const result = funds.reduce(
			(total, fund) => total + Number(fund.shares?.value),
			0,
		);

		expect(result).toBe(expectedResult);
	});

	it("should give the mock-up change against the quarter before when reading the six largest funds", () => {
		const expectedResult = [1.2, 0.8, -0.4, 2.6, 1.1, -3.9];

		const result = funds
			.slice(0, 6)
			.map(
				(fund) =>
					Math.round(
						(Number(fund.shares?.value) /
							Number(fund.sharesQuarterEarlier?.value) -
							1) *
							1000,
					) / 10,
			);

		expect(result).toEqual(expectedResult);
	});

	it("should leave no figure a quarter earlier only when the fund first filed for Q2 2026", () => {
		const expectedResult = ["Fund 38"];

		const result = funds
			.filter((fund) => fund.sharesQuarterEarlier === null)
			.map((fund) => fund.fund);

		expect(result).toEqual(expectedResult);
	});

	it("should read the 13F of 31 Mar 2026 when reading each fund a quarter earlier", () => {
		const expectedResult = ["2026-03-31 Q1 2026"];

		const result = [
			...new Set(
				funds.flatMap(({ sharesQuarterEarlier }) =>
					sharesQuarterEarlier?.source.kind === "reported" &&
					sharesQuarterEarlier.source.document.kind === "filing"
						? [
								`${sharesQuarterEarlier.period?.endsOn} ${sharesQuarterEarlier.source.document.periodLabel}`,
							]
						: [],
				),
			),
		];

		expect(result).toEqual(expectedResult);
	});

	it("should list the insiders of the Overview ownership in the same order when reading the insider rows", () => {
		const { insiderShares } = meridianOverview.ownership;

		const expectedResult =
			insiderShares?.source.kind === "derived"
				? insiderShares.source.inputs.map((input) => input.label)
				: [];

		const result = meridianRelationships.insiders.map(
			(insider) => insider.shares?.label,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give the mock-up stake percentages when dividing the shares held by the shares outstanding", () => {
		const expectedResult = [12.4, 7.2, 4.8, 3.1, 1.9, 0.8];

		const result = stakes.map(
			(stake) =>
				Math.round(
					(Number(stake.sharesHeld?.value) /
						Number(stake.sharesOutstanding?.value)) *
						1000,
				) / 10,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should source each share count of a stake from a 10-Q that the target company filed", () => {
		const expectedResult = stakes.map((stake) => `10-Q ${stake.company}`);

		const result = stakes.map(({ sharesOutstanding }) =>
			sharesOutstanding?.source.kind === "reported" &&
			sharesOutstanding.source.document.kind === "filing"
				? `${sharesOutstanding.source.document.form} ${sharesOutstanding.source.document.filer}`
				: null,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should open Exhibit 21 of the FY2026 10-K when reading the source of each subsidiary", () => {
		const exhibit = `${tenK(2026).indexUrl}mrdn-ex21.htm`;

		const expectedResult = subsidiaries.map(() => exhibit);

		const result = subsidiaries.map(({ jurisdiction }) =>
			jurisdiction?.source.kind === "reported" ? jurisdiction.source.url : null,
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("the MRDN management sample data", () => {
	const { people, ceoPay, insiderSharesBought, insiderSharesSold } =
		meridianManagement;
	const inputsOf = (point: Claim | null) =>
		point?.source.kind === "derived" ? point.source.inputs : [];

	it("should equal the Relationships insiders row by row when the section prefix of the ids is ignored", () => {
		const expectedResult = asSection(
			meridianRelationships.insiders,
			"relationships",
			"management",
		);

		const result = meridianManagement.insiders;

		expect(result).toEqual(expectedResult);
	});

	it("should give the chief executive of the profile the same start year when reading the people", () => {
		const { chiefExecutive, chiefExecutiveSince } = meridianOverview.profile;

		const expectedResult = chiefExecutiveSince?.value;

		const result = people.find(
			(person) => person.name === chiefExecutive?.value,
		)?.since?.value;

		expect(result).toBe(expectedResult);
	});

	it("should leave the independence missing only when the person is not a director", () => {
		const expectedResult = people
			.filter((person) => !person.isDirector)
			.map((person) => person.name);

		const result = people
			.filter((person) => person.independence === null)
			.map((person) => person.name);

		expect(result).toEqual(expectedResult);
	});

	it("should read each year of CEO pay from the proxy statement of that year when reading the pay rows oldest first", () => {
		const expectedResult = ceoPay.map(
			(row) => `FY${row.fiscalYear} ${row.fiscalYear} annual meeting`,
		);

		const result = ceoPay.map((row) =>
			row.salary?.source.kind === "reported" &&
			row.salary.source.document.kind === "filing"
				? `FY${row.salary.period?.fiscalYear} ${row.salary.source.document.periodLabel}`
				: null,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should add up to the mock-up total when summing the FY2026 CEO pay", () => {
		const latest = ceoPay[ceoPay.length - 1];

		const expectedResult = 38_790_000;

		const result = [
			latest.salary,
			latest.bonus,
			latest.stockAwards,
			latest.other,
		].reduce((total, figure) => total + Number(figure?.value), 0);

		expect(result).toBe(expectedResult);
	});

	it("should give the mock-up net insider shares in millions when subtracting the shares sold from the shares bought", () => {
		const expectedResult = [
			-4.1, -6.3, 0.6, -3.8, -5.5, -9.2, 1.1, -12.6, -18.9, -21.3,
		];

		const result = insiderSharesBought.points.map(
			(bought, row) =>
				(Number(bought?.value) - Number(insiderSharesSold.points[row]?.value)) /
				1_000_000,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should equal the sum of its Form 4 trades when reading each yearly point", () => {
		const expectedResult: string[] = [];

		const result = [...insiderSharesBought.points, ...insiderSharesSold.points]
			.filter(
				(point) =>
					inputsOf(point).reduce(
						(total, trade) => total + Number(trade.value),
						0,
					) !== point?.value,
			)
			.map((point) => String(point?.id));

		expect(result).toEqual(expectedResult);
	});

	it("should date every Form 4 trade inside the fiscal year of its point when reading the insider trades", () => {
		const expectedResult: string[] = [];

		const result = [...insiderSharesBought.points, ...insiderSharesSold.points]
			.flatMap((point) =>
				inputsOf(point).filter(
					(trade) =>
						trade.period === null ||
						fiscalYearOf(trade.period.endsOn) !== point?.period?.fiscalYear,
				),
			)
			.map((trade) => trade.id);

		expect(result).toEqual(expectedResult);
	});

	it("should count the mock-up Form 4 filings when counting the trades of each fiscal year", () => {
		const expectedResult = [18, 20, 19, 22, 21, 24, 23, 27, 38, 30];

		const result = insiderSharesBought.points.map(
			(bought, row) =>
				inputsOf(bought).length +
				inputsOf(insiderSharesSold.points[row]).length,
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("the MRDN filings sample data", () => {
	const { filings } = meridianFilingsSection;

	it("should give every filing an accession number in the SEC form when reading every section", () => {
		const expectedResult: string[] = [];

		const result = accessionNumbersOf([
			...SECTIONS,
			meridianFilingsSection,
		]).filter(
			(accessionNumber) => !/^\d{10}-\d{2}-\d{6}$/.test(accessionNumber),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should list every filing that a company claim cites when the Filings section is built", () => {
		const listed = filings.map((filing) => filing.accessionNumber);

		const expectedResult: string[] = [];

		const result = sourcesOf(companyClaimsOf(SECTIONS))
			.groups.map(({ document }) => document)
			.filter((document) => document.kind === "filing")
			.map((document) => document.accessionNumber)
			.filter((accessionNumber) => !listed.includes(accessionNumber));

		expect(result).toEqual(expectedResult);
	});

	it("should list no filing behind a sector benchmark when the Filings section is built", () => {
		const benchmarkFilings = accessionNumbersOf([
			meridianOverview.sectorBenchmarks,
			meridianValuation.sectorBenchmarks,
		]);

		const expectedResult: string[] = [];

		const result = filings
			.map((filing) => filing.accessionNumber)
			.filter((accessionNumber) => benchmarkFilings.includes(accessionNumber));

		expect(result).toEqual(expectedResult);
	});

	it("should list the cited filings by form when counting the filings that the company claims read", () => {
		const expectedResult = {
			"10-K": 10,
			"10-Q": 13,
			"8-K": 1,
			"DEF 14A": 10,
			"Form 4": 248,
			"13F-HR": 76,
		};

		const result = Object.fromEntries(
			Object.keys(expectedResult).map((form) => [
				form,
				filings.filter((filing) => filing.form === form).length,
			]),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read every market figure from the Nasdaq prices or the Treasury yields when reading every claim", () => {
		const datasets = new Set([nasdaqPrices, treasuryYields]);

		const expectedResult: string[] = [];

		const result = everyClaim()
			.filter(
				({ source }) =>
					source.kind === "reported" &&
					source.document.kind === "market" &&
					!datasets.has(source.document),
			)
			.map((claim) => claim.id);

		expect(result).toEqual(expectedResult);
	});

	it("should list the 10-K and 10-Q filings that set the statement windows when reading the Meridian reports", () => {
		const expectedResult = [...meridianFilings]
			.map((filing) => filing.accessionNumber)
			.sort();

		const result = filings
			.filter(
				(filing) =>
					(filing.form === "10-K" || filing.form === "10-Q") &&
					filing.filer === MERIDIAN,
			)
			.map((filing) => filing.accessionNumber)
			.sort();

		expect(result).toEqual(expectedResult);
	});

	it("should list the filings newest first when reading the list", () => {
		const expectedResult = filings
			.map((filing) => filing.filedOn)
			.sort()
			.reverse();

		const result = filings.map((filing) => filing.filedOn);

		expect(result).toEqual(expectedResult);
	});

	it("should give each distinct filing its own accession number when reading every reported source", () => {
		const expectedResult: string[] = [];

		const records = new Map<string, string>();
		const result = everyClaim().flatMap(({ source }) => {
			if (source.kind !== "reported" || source.document.kind !== "filing") {
				return [];
			}
			const { accessionNumber, filer, form, filedOn } = source.document;
			const record = `${form} ${filer} ${filedOn}`;
			const seen = records.get(accessionNumber) ?? record;
			records.set(accessionNumber, seen);
			return seen === record
				? []
				: [`${accessionNumber}: ${seen} and ${record}`];
		});

		expect(result).toEqual(expectedResult);
	});

	it("should hold no filing twice when reading the accession numbers of the list", () => {
		const expectedResult = filings.length;

		const result = new Set(filings.map((filing) => filing.accessionNumber))
			.size;

		expect(result).toBe(expectedResult);
	});
});
