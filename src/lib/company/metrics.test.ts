import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { MissingGuardInput } from "./errors";
import {
	completeQuarters,
	completeSections,
	evaluate,
	evaluateMetric,
	type FigureRef,
	flowLineKeys,
	isValidFigureRef,
	type MetricResult,
	type Metric,
	metrics,
	sameRef,
} from "./metrics";
import type {
	Claim,
	CompanySections,
	CompletedSections,
	FinancialsSection,
	Figure,
	IsoDate,
	LineKey,
	Period,
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

/**
 * Returns the completed sections of the fixture with the value of line `key`
 * in one table set to `value` at each of `positions`. `null` removes the point.
 */
function sectionsWith(
	statement: keyof FinancialsSection,
	table: "annual" | "quarterly",
	key: LineKey,
	positions: number[],
	value: number | null,
): CompletedSections {
	const original = fakeCompanyReport.financials[statement];
	const changed = positions.reduce((current, position) => {
		const point = pointsOf(current, key, [position])[0];
		return withPoint(
			current,
			key,
			position,
			point === null || value === null ? null : { ...point, value },
		);
	}, original[table]);
	return completeSections({
		...fakeCompanyReport,
		financials: {
			...fakeCompanyReport.financials,
			[statement]: { ...original, [table]: changed },
		},
	});
}

/** Returns the ids of the input claims of a `value` result, or the result kind. */
function inputIdsOf(result: MetricResult): string[] | string {
	return result.kind === "value" && result.claim.source.kind === "derived"
		? result.claim.source.inputs.map((claim) => claim.id)
		: result.kind;
}

const completed = completeSections(fakeCompanyReport);
const price = fakeCompanyReport.masthead.price as Claim;
const [sharesFY2025] = pointsOf(income.annual, "dilutedShares", [9]) as Claim[];

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

describe("evaluateMetric", () => {
	it("should multiply the price by the diluted shares of the latest fiscal year when it evaluates market cap", () => {
		const sections = completed;

		const expectedResult: MetricResult = {
			kind: "value",
			claim: {
				id: "metric.marketCap",
				label: "Market cap",
				value: 84.2 * 151_100_000,
				unit: "usd",
				period: null,
				source: {
					kind: "derived",
					formula: "Price × diluted shares, latest fiscal year",
					inputs: [price, sharesFY2025],
				},
			},
		};

		const result = evaluateMetric("marketCap", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should mint each id from the key and the shared period when it evaluates point and per-period metrics", () => {
		const sections = completed;
		const [fiscalYear2021] = income.annual.periods.slice(5, 6);

		const expectedResult = [
			"metric.stockPayToRevenue.FY2025",
			"metric.returnOnEquity",
			"metric.freeCashFlow.FY2021",
		];

		const result = [
			evaluateMetric("stockPayToRevenue", sections),
			evaluateMetric("returnOnEquity", sections),
			evaluateMetric("freeCashFlow", sections, fiscalYear2021),
		].map((metric) => (metric.kind === "value" ? metric.claim.id : null));

		expect(result).toEqual(expectedResult);
	});

	it("should divide the dividends of the last four derived quarters by market cap when it evaluates the dividend yield", () => {
		const sections = completed;

		const expectedResult = {
			value: 66_000_000 / (84.2 * 151_100_000),
			inputs: ["metric.dividendsPaid.L4Q-2025-12-31", "metric.marketCap"],
		};

		const yieldResult = evaluateMetric("dividendYield", sections);
		const result = {
			value: yieldResult.kind === "value" ? yieldResult.claim.value : null,
			inputs: inputIdsOf(yieldResult),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should divide the operating income by the revenue of FY2025 when it evaluates the operating margin at FY2025", () => {
		const sections = completed;
		const [fiscalYear2025] = income.annual.periods.slice(9);

		// Operating income 450M ÷ revenue 3,200M.
		const expectedResult = 450_000_000 / 3_200_000_000;

		const margin = evaluateMetric("operatingMargin", sections, fiscalYear2025);
		const result = margin.kind === "value" ? margin.claim.value : null;

		expect(result).toEqual(expectedResult);
	});

	it("should divide the net buybacks of the last four derived quarters by market cap when it evaluates the buyback yield", () => {
		const sections = completed;

		// The last four quarters are FY2025, with a cash flow base of 330M:
		// repurchases 0.3 × 330M = 99M, stock plan proceeds 0.05 × 330M = 16.5M.
		// Market cap is $84.2 × 151.1M shares.
		const expectedResult = (99_000_000 - 16_500_000) / (84.2 * 151_100_000);

		const buyback = evaluateMetric("buybackYield", sections);
		const result = buyback.kind === "value" ? buyback.claim.value : null;

		expect(result).toEqual(expectedResult);
	});

	it("should add the short-term and long-term debt of the latest quarter end when it evaluates total debt", () => {
		const sections = completed;

		// Short-term debt 0.05 × current assets 1,350M = 67.5M, long-term debt
		// 0.15 × total assets 3,900M = 585M.
		const expectedResult = 67_500_000 + 585_000_000;

		const debt = evaluateMetric("totalDebt", sections);
		const result = debt.kind === "value" ? debt.claim.value : null;

		expect(result).toEqual(expectedResult);
	});

	it("should divide the current assets by the current liabilities of the latest quarter end when it evaluates the current ratio", () => {
		const sections = completed;

		// Current assets 1,350M ÷ current liabilities 0.5 × 1,350M = 675M.
		const expectedResult = 1_350_000_000 / 675_000_000;

		const current = evaluateMetric("currentRatio", sections);
		const result = current.kind === "value" ? current.claim.value : null;

		expect(result).toEqual(expectedResult);
	});

	it("should read the ten covered fiscal years when the price series has a year with no 10-K", () => {
		const { masthead } = fakeCompanyReport;
		const series = masthead.priceAtFiscalYearEnds;
		const lastPrice = series.points[9] as Claim;
		const period: Period = {
			...series.periods[9],
			fiscalYear: 2026,
			endsOn: "2026-12-31" as IsoDate,
		};
		const sections = completeSections({
			...fakeCompanyReport,
			masthead: {
				...masthead,
				priceAtFiscalYearEnds: {
					...series,
					periods: [...series.periods, period],
					points: [...series.points, { ...lastPrice, period, value: 99 }],
				},
			},
		});

		const expectedResult = income.annual.periods.map(
			(year) => `metric.priceToEarningsAtYearEnd.FY${year.fiscalYear}`,
		);

		const result = inputIdsOf(
			evaluateMetric("priceToEarningsMedian10y", sections),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should average the two middle year-end P/E ratios of FY2025 and FY2019 when every year has earnings", () => {
		const sections = completed;

		const expectedResult = (82.75 / 2.25 + 45.3 / 1.23) / 2;

		const median = evaluateMetric("priceToEarningsMedian10y", sections);
		const result = median.kind === "value" ? median.claim.value : null;

		expect(result).toEqual(expectedResult);
	});

	it("should leave a loss year out of the median when its EPS fails the guard", () => {
		const sections = sectionsWith("income", "annual", "dilutedEps", [4], -0.4);

		const expectedResult = income.annual.periods
			.filter((year) => year.fiscalYear !== 2020)
			.map((year) => `metric.priceToEarningsAtYearEnd.FY${year.fiscalYear}`);

		const result = inputIdsOf(
			evaluateMetric("priceToEarningsMedian10y", sections),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give a short history when fewer than five of the ten years have EPS", () => {
		const sections = sectionsWith(
			"income",
			"annual",
			"dilutedEps",
			[0, 1, 2, 3, 4, 5],
			null,
		);

		const expectedResult: MetricResult = { kind: "shortHistory" };

		const result = evaluateMetric("priceToEarningsMedian10y", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should fail the EPS guard of the P/E when the company made a loss", () => {
		const sections = sectionsWith("income", "annual", "dilutedEps", [9], -1.2);
		const [eps] = pointsOf(income.annual, "dilutedEps", [9]) as Claim[];

		const expectedResult: MetricResult = {
			kind: "failedGuard",
			guard: metrics.priceToEarnings.guards[0],
			input: { ...eps, value: -1.2 },
		};

		const result = evaluateMetric("priceToEarnings", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should fail the equity guard of the return on equity when the equity is below 0", () => {
		const sections = sectionsWith(
			"balance",
			"quarterly",
			"shareholdersEquity",
			[7],
			-2_000_000_000,
		);
		const [equity] = pointsOf(
			balance.quarterly,
			"shareholdersEquity",
			[7],
		) as Claim[];

		const expectedResult: MetricResult = {
			kind: "failedGuard",
			guard: metrics.returnOnEquity.guards[0],
			input: { ...equity, value: -2_000_000_000 },
		};

		const result = evaluateMetric("returnOnEquity", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should pass on the failed guard of market cap when the dividend yield reads a market cap of 0", () => {
		const sections = sectionsWith("income", "annual", "dilutedShares", [9], 0);

		const expectedResult = { kind: "failedGuard", input: "metric.marketCap" };

		const yieldResult = evaluateMetric("dividendYield", sections);
		const result =
			yieldResult.kind === "failedGuard"
				? { kind: yieldResult.kind, input: yieldResult.input.id }
				: yieldResult;

		expect(result).toEqual(expectedResult);
	});

	it("should give a missing input when the free cash flow yield reads a market cap with no price", () => {
		const sections = completeSections({
			...fakeCompanyReport,
			masthead: { ...fakeCompanyReport.masthead, price: null },
		});

		const expectedResult: MetricResult = { kind: "missingInput" };

		const result = evaluateMetric("freeCashFlowYield", sections);

		expect(result).toEqual(expectedResult);
	});
});

describe("evaluate", () => {
	it("should throw MissingGuardInput when a guard names a figure that is not an input of the metric", () => {
		const guarded: FigureRef = {
			from: "line",
			key: "totalCurrentLiabilities",
			at: { kind: "fiscalYear", yearsBack: 0 },
		};
		const metric: Metric = {
			...metrics.currentRatio,
			guards: [{ input: guarded, comparison: "above", value: 0 }],
		};

		const expectedResult = new MissingGuardInput("currentRatio", guarded);

		const result = () => evaluate(metric, completed, null);

		expect(result).toThrow(expectedResult);
	});
});

describe("isValidFigureRef", () => {
	it("should reject each reference that note §4 and §5 call a defect", () => {
		const refs: FigureRef[] = [
			{ from: "line", key: "dilutedShares", at: { kind: "lastFourQuarters" } },
			{ from: "line", key: "dilutedEps", at: { kind: "lastFourQuarters" } },
			{
				from: "line",
				key: "shareholdersEquity",
				at: { kind: "lastFourQuarters" },
			},
			{ from: "line", key: "dilutedShares", at: { kind: "latestQuarter" } },
			{ from: "line", key: "dilutedEps", at: { kind: "latestQuarter" } },
			{
				from: "market",
				key: "price",
				at: { kind: "fiscalYear", yearsBack: 0 },
			},
			{
				from: "market",
				key: "priceAtFiscalYearEnd",
				at: { kind: "latestClose" },
			},
			{ from: "metric", key: "freeCashFlow", at: null },
			{ from: "metric", key: "freeCashFlow", at: { kind: "latestQuarter" } },
			{
				from: "metric",
				key: "freeCashFlow",
				at: { kind: "lastFourQuarters" },
			},
			{ from: "metric", key: "marketCap", at: { kind: "latestClose" } },
		];

		const expectedResult = refs.map(() => false);

		const result = refs.map(isValidFigureRef);

		expect(result).toEqual(expectedResult);
	});

	it("should find no defect in any metric when it checks the inputs, the guards and minPoints", () => {
		const all = Object.values(metrics);

		const expectedResult: string[] = [];

		const result = all
			.filter((metric) => {
				const windows = metric.inputs.filter(
					(ref) => ref.at?.kind === "lastFiscalYears",
				);
				return (
					!metric.inputs.every(isValidFigureRef) ||
					!metric.guards.every(
						({ input }) =>
							metric.inputs.some((ref) => sameRef(ref, input)) &&
							input.at?.kind !== "lastFiscalYears",
					) ||
					(windows.length === 0) !== (metric.minPoints === null)
				);
			})
			.map((metric) => metric.key);

		expect(result).toEqual(expectedResult);
	});
});
