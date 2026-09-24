import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { completeQuarters, completeSections, flowLineKeys } from "./metrics";
import type {
	Claim,
	CompanySections,
	Figure,
	LineKey,
	Statement,
	StatementTable,
} from "./types";

const { income, balance, cashFlow } = fakeCompanyReport.financials;

/** The positions of the quarters of FY2025 in the quarterly tables of the fixture. */
const FY2025 = [4, 5, 6, 7];

/** The flow lines of the table in note §4, in the order of the note. */
const FLOW_LINES: LineKey[] = [
	"revenue",
	"operatingIncome",
	"netIncome",
	"operatingCashFlow",
	"capitalExpenditure",
	"dividendsPaid",
	"shareRepurchases",
	"shareIssuanceProceeds",
	"shareBasedCompensation",
];

/** Returns the points of line `key` in `table` at `positions`. */
function pointsOf(
	table: StatementTable,
	key: LineKey,
	positions: number[],
): Figure[] {
	const line = table.lines.find((candidate) => candidate.key === key);
	return positions.map((position) => line?.points[position] ?? null);
}

/** Returns the values of line `key` in `table` at `positions`, in millions. */
function millionsOf(
	table: StatementTable,
	key: LineKey,
	positions: number[],
): (number | null)[] {
	return pointsOf(table, key, positions).map((point) =>
		point === null ? null : Number(point.value) / 1_000_000,
	);
}

/** Returns `table` with the point of line `key` at `position` set to `figure`. */
function withPoint(
	table: StatementTable,
	key: LineKey,
	position: number,
	figure: Figure,
): StatementTable {
	return {
		...table,
		lines: table.lines.map((line) =>
			line.key === key
				? {
						...line,
						points: line.points.map((point, index) =>
							index === position ? figure : point,
						),
					}
				: line,
		),
	};
}

/**
 * Returns `table` from the period at `start` onwards, so the window starts
 * inside a fiscal year.
 */
function fromPosition(table: StatementTable, start: number): StatementTable {
	return {
		periods: table.periods.slice(start),
		lines: table.lines.map((line) => ({
			...line,
			periods: line.periods.slice(start),
			points: line.points.slice(start),
		})),
	};
}

describe("flowLineKeys", () => {
	it("should hold the flow lines of note §4 when read as a list", () => {
		const expectedResult = FLOW_LINES;

		const result = [...flowLineKeys];

		expect(result).toEqual(expectedResult);
	});
});

describe("completeQuarters", () => {
	it("should derive the fourth quarter of exactly the flow lines of note §4 when the statements are the fixture", () => {
		const statements: Statement[] = [income, balance, cashFlow];

		const expectedResult = FLOW_LINES;

		const result = statements.flatMap((statement) =>
			completeQuarters(statement)
				.lines.filter((line) => line.points[7]?.source.kind === "derived")
				.map((line) => line.key),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the oldest fourth quarter null when the window starts at it and there is no nine-month figure", () => {
		const statement: Statement = {
			...income,
			quarterly: fromPosition(income.quarterly, 3),
			yearToDate: null,
		};

		const expectedResult = [null];

		const result = pointsOf(completeQuarters(statement), "revenue", [0]);

		expect(result).toEqual(expectedResult);
	});

	it("should derive the oldest fourth quarter from the nine-month figure when the window starts at it", () => {
		const statement: Statement = {
			...cashFlow,
			quarterly: fromPosition(cashFlow.quarterly, 3),
		};

		const expectedResult = [120];

		const result = millionsOf(
			completeQuarters(statement),
			"operatingCashFlow",
			[0],
		);

		expect(result).toEqual(expectedResult);
	});

	it("should derive the fourth quarter as the fiscal year minus the first three quarters when the line is an income flow line", () => {
		const statement: Statement = { ...income, yearToDate: null };

		const expectedResult = [760, 790, 810, 840];

		const result = millionsOf(completeQuarters(statement), "revenue", FY2025);

		expect(result).toEqual(expectedResult);
	});

	it("should derive each later quarter from the year-to-date figures when the line is a cash flow line", () => {
		const statement: Statement = cashFlow;

		const expectedResult = [110, 115, 125, 130];

		const result = millionsOf(
			completeQuarters(statement),
			"operatingCashFlow",
			FY2025,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should derive the dividends paid of each later quarter when the port returns only the first quarter", () => {
		const statement: Statement = cashFlow;

		const expectedResult = [15, 16, 17, 18];

		const result = millionsOf(
			completeQuarters(statement),
			"dividendsPaid",
			FY2025,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give the derived quarter a claim with the formula and the reported inputs when it derives a fourth quarter", () => {
		const statement: Statement = { ...income, yearToDate: null };
		const [fiscalYear] = pointsOf(income.annual, "revenue", [9]) as Claim[];
		const quarters = pointsOf(income.quarterly, "revenue", [4, 5, 6]);

		const expectedResult: Claim = {
			id: "metric.revenue.Q4-FY2025",
			label: "Revenue",
			value: 840_000_000,
			unit: "usd",
			period: income.quarterly.periods[7],
			source: {
				kind: "derived",
				formula: "FY2025 − Q1 FY2025 − Q2 FY2025 − Q3 FY2025",
				inputs: [fiscalYear, ...(quarters as Claim[])],
			},
		};

		const [result] = pointsOf(completeQuarters(statement), "revenue", [7]);

		expect(result).toEqual(expectedResult);
	});

	it("should derive the income fourth quarter from the nine-month figure when the year-to-date table has it", () => {
		const statement: Statement = income;

		const expectedResult = ["FY2025 − 9 months to Q3 FY2025", 840_000_000];

		const [point] = pointsOf(completeQuarters(statement), "revenue", [7]);
		const result =
			point?.source.kind === "derived"
				? [point.source.formula, point.value]
				: null;

		expect(result).toEqual(expectedResult);
	});

	it("should name the year-to-date inputs in the formula when it derives a cash flow quarter", () => {
		const statement: Statement = cashFlow;

		const expectedResult = [
			"6 months to Q2 FY2025 − Q1 FY2025",
			"9 months to Q3 FY2025 − 6 months to Q2 FY2025",
			"FY2025 − 9 months to Q3 FY2025",
		];

		const result = pointsOf(
			completeQuarters(statement),
			"operatingCashFlow",
			[5, 6, 7],
		).map((point) =>
			point?.source.kind === "derived" ? point.source.formula : null,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the fourth quarter null when the line is diluted shares or diluted EPS", () => {
		const statement: Statement = income;

		const expectedResult = { dilutedShares: [null], dilutedEps: [null] };

		const result = {
			dilutedShares: pointsOf(
				completeQuarters(statement),
				"dilutedShares",
				[7],
			),
			dilutedEps: pointsOf(completeQuarters(statement), "dilutedEps", [7]),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should return the same quarterly table when the statement is the balance sheet", () => {
		const statement: Statement = balance;

		const expectedResult = balance.quarterly;

		const result = completeQuarters(statement);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the fourth quarter null when the annual table has no figure for the fiscal year", () => {
		const statement: Statement = {
			...income,
			annual: withPoint(income.annual, "revenue", 9, null),
		};

		const expectedResult = [null];

		const result = pointsOf(completeQuarters(statement), "revenue", [7]);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the second quarter null when the first quarter is missing", () => {
		const statement: Statement = {
			...cashFlow,
			quarterly: withPoint(cashFlow.quarterly, "operatingCashFlow", 4, null),
		};

		const expectedResult = [null, null, 125, 130];

		const result = millionsOf(
			completeQuarters(statement),
			"operatingCashFlow",
			FY2025,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the fourth quarter null when the fiscal year is not a number", () => {
		const [fiscalYear] = pointsOf(income.annual, "revenue", [9]) as Claim[];
		const statement: Statement = {
			...income,
			annual: withPoint(income.annual, "revenue", 9, {
				...fiscalYear,
				value: "3.2B",
			}),
		};

		const expectedResult = [null];

		const result = pointsOf(completeQuarters(statement), "revenue", [7]);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the fourth quarter null when a reported quarter has no period", () => {
		const [firstQuarter] = pointsOf(
			income.quarterly,
			"revenue",
			[0],
		) as Claim[];
		const statement: Statement = {
			...income,
			quarterly: withPoint(income.quarterly, "revenue", 0, {
				...firstQuarter,
				period: null,
			}),
			yearToDate: null,
		};

		const expectedResult = [null];

		const result = pointsOf(completeQuarters(statement), "revenue", [3]);

		expect(result).toEqual(expectedResult);
	});

	it("should leave the statement unchanged when it derives the quarters", () => {
		const statement: Statement = structuredClone(cashFlow);

		const expectedResult = structuredClone(cashFlow);

		completeQuarters(statement);
		const result = statement;

		expect(result).toEqual(expectedResult);
	});
});

describe("completeSections", () => {
	it("should hold the completed quarterly tables when the financials have loaded", () => {
		const sections: CompanySections = fakeCompanyReport;

		const expectedResult = {
			income: completeQuarters(income),
			balance: completeQuarters(balance),
			cashFlow: completeQuarters(cashFlow),
		};

		const result = {
			income: completeSections(sections).financials?.income.quarterly,
			balance: completeSections(sections).financials?.balance.quarterly,
			cashFlow: completeSections(sections).financials?.cashFlow.quarterly,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should keep the annual and year-to-date tables and the other sections when it completes the quarters", () => {
		const sections: CompanySections = fakeCompanyReport;

		const expectedResult = {
			masthead: fakeCompanyReport.masthead,
			overview: fakeCompanyReport.overview,
			annual: income.annual,
			yearToDate: cashFlow.yearToDate,
		};

		const completed = completeSections(sections);
		const result = {
			masthead: completed.masthead,
			overview: completed.overview,
			annual: completed.financials?.income.annual,
			yearToDate: completed.financials?.cashFlow.yearToDate,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should keep the financials null when the financials have not loaded", () => {
		const sections: CompanySections = {
			...fakeCompanyReport,
			financials: null,
		};

		const expectedResult = null;

		const result = completeSections(sections).financials;

		expect(result).toEqual(expectedResult);
	});

	it("should leave the sections of the port unchanged when it completes the quarters", () => {
		const sections: CompanySections = structuredClone(fakeCompanyReport);

		const expectedResult = structuredClone(fakeCompanyReport);

		completeSections(sections);
		const result = sections;

		expect(result).toEqual(expectedResult);
	});

	it("should return a new object when given the sections of the port", () => {
		const sections: CompanySections = fakeCompanyReport;

		const expectedResult = false;

		const result = completeSections(sections) === sections;

		expect(result).toBe(expectedResult);
	});
});
