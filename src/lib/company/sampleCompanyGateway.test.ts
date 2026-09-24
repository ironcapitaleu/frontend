import { describe, expect, it } from "vitest";

import { Ticker } from "../domain/ticker";
import { MissingCompany } from "./errors";
import { meridianFinancials } from "./sample/financials";
import { meridianMasthead } from "./sample/masthead";
import { meridianOverview } from "./sample/overview";
import { MERIDIAN, MissingSampleData, tenK } from "./sample/sources";
import { sampleCompanyGateway } from "./sampleCompanyGateway";
import type {
	Claim,
	LineKey,
	Period,
	StatementLine,
	StatementTable,
} from "./types";

const MRDN = Ticker.parse("MRDN");
const AAPL = Ticker.parse("AAPL");
const SECTIONS = [meridianMasthead, meridianOverview, meridianFinancials];
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

	it("should print the filing date as the period of each Form 4 when reading the insider holdings", () => {
		const expectedResult = [
			"18 Jun 2026",
			"21 Apr 2026",
			"2 Jun 2026",
			"14 Mar 2026",
			"14 Mar 2026",
			"2 Jun 2026",
		];

		const result = everyClaim().flatMap(({ source }) =>
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
