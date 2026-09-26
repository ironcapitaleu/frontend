import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import {
	type Check,
	type CheckResult,
	checks,
	evaluateCheck,
	evaluateChecks,
} from "./checks";
import {
	completeSections,
	type FigureRef,
	isValidFigureRef,
	metrics,
} from "./metrics";
import type {
	CompletedSections,
	Unit,
	FinancialsSection,
	LineKey,
	StatementTable,
} from "./types";

/** One change to the fixture: set line `key` of one table to `value` at `positions`. */
type Edit = [
	statement: keyof FinancialsSection,
	table: "annual" | "quarterly",
	key: LineKey,
	positions: number[],
	value: number | string | null,
];

/** Returns `table` with one {@link Edit}. `null` removes the points. */
function edited(table: StatementTable, [, , key, positions, value]: Edit) {
	return {
		...table,
		lines: table.lines.map((line) => ({
			...line,
			points: line.points.map((point, index) =>
				line.key !== key || !positions.includes(index)
					? point
					: point && value !== null
						? { ...point, value }
						: null,
			),
		})),
	};
}

/** Returns the completed sections of the fixture with each of `edits`. */
function sectionsWith(...edits: Edit[]): CompletedSections {
	let financials = fakeCompanyReport.financials;
	for (const edit of edits) {
		const [statement, table] = edit;
		const original = financials[statement];
		const changed = { ...original, [table]: edited(original[table], edit) };
		financials = { ...financials, [statement]: changed };
	}
	return completeSections({ ...fakeCompanyReport, financials });
}

/** Returns the completed sections of the fixture with no annual column at `position` in any statement. */
function sectionsWithoutYear(position: number): CompletedSections {
	const kept = (_: unknown, index: number) => index !== position;
	const withoutColumn = ({ periods, lines }: StatementTable) => ({
		periods: periods.filter(kept),
		lines: lines.map((line) => ({
			...line,
			periods: line.periods.filter(kept),
			points: line.points.filter(kept),
		})),
	});
	const { income, balance, cashFlow } = fakeCompanyReport.financials;
	const financials = {
		income: { ...income, annual: withoutColumn(income.annual) },
		balance: { ...balance, annual: withoutColumn(balance.annual) },
		cashFlow: { ...cashFlow, annual: withoutColumn(cashFlow.annual) },
	};
	return completeSections({ ...fakeCompanyReport, financials });
}

/** Returns the check with `id` evaluated over `sections`, as its state and reason. */
function outcomeOf(id: string, sections: CompletedSections) {
	const check = checks.find((candidate) => candidate.id === id);
	const result = check && evaluateCheck(check, sections);
	return result && { state: result.state, reason: result.reason };
}

/** Returns the unit of the figure that `ref` names. The Treasury yield is a percent. */
function unitOf(ref: FigureRef): Unit | undefined {
	const { income, balance, cashFlow } = fakeCompanyReport.financials;
	switch (ref.from) {
		case "metric":
			return metrics[ref.key].unit;
		case "market":
			return ref.key === "treasuryYield10y" ? "percent" : "usdPerShare";
		case "line":
			return [income, balance, cashFlow]
				.flatMap((statement) => statement.annual.lines)
				.find((line) => line.key === ref.key)?.unit;
	}
}

const completed = completeSections(fakeCompanyReport);

describe("evaluateChecks", () => {
	it("should give each check the verdict worked out by hand when the sections are the fixture", () => {
		const sections = completed;

		// FY2025 is the latest year, the price is $84.20 and the latest quarter end is 31 Dec 2025.
		const expectedResult = {
			B1: "notMet", // cash 0.4 × 1,350M = 540M is not above debt 67.5M + 585M = 652.5M
			B2: "met", // current ratio 1,350M ÷ 675M = 2.0 is at least 1.5
			P1: "met", // stock pay 0.25 × 330M = 82.5M ÷ revenue 3,200M = 2.6% is below 5%
			P2: "met", // net income 340M ÷ equity 0.55 × 3,900M = 2,145M = 15.9% is at least 15%
			V1: "notMet", // P/E 84.2 ÷ 2.25 = 37.4 is not below the median (82.75 ÷ 2.25 + 45.3 ÷ 1.23) ÷ 2 = 36.8
			V2: "notMet", // free cash flow yield 348M ÷ 12.7B = 2.7% is not above the Treasury yield now, 4.25%
			S1: "met", // 151.1M diluted shares in FY2025 are below 158.4M in FY2020
			S2: "notMet", // dividends 66M ÷ market cap 84.2 × 151.1M = 12.7B = 0.5% is below 2%
			S3: "met", // dividends 0.2 × 330M = 66M are at most free cash flow 480M − 132M = 348M
			C1: "met", // free cash flow is above 0 in all ten years, the lowest is FY2020 at 240M − 68M
			C2: "met", // net income is above 0 in all ten years, the lowest is FY2020 at 140M
		};

		const result = Object.fromEntries(
			evaluateChecks(sections)
				.flatMap((area) => area.results)
				.map(({ check, state, reason }: CheckResult) => [
					check.id,
					reason === null ? state : `${state}/${reason}`,
				]),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should group the checks by area in the order of the page and count the met checks when the sections are the fixture", () => {
		const sections = completed;

		// Met: B2, P1, P2, S1, S3, C1 and C2. Neither valuation check is met.
		const expectedResult = [
			{ area: "balanceSheet", ids: ["B1", "B2"], metCount: 1 },
			{ area: "profitability", ids: ["P1", "P2"], metCount: 2 },
			{ area: "valuation", ids: ["V1", "V2"], metCount: 0 },
			{ area: "shareholderReturns", ids: ["S1", "S2", "S3"], metCount: 2 },
			{ area: "consistency", ids: ["C1", "C2"], metCount: 2 },
		];

		const result = evaluateChecks(sections).map(
			({ area, results, metCount }) => ({
				area,
				ids: results.map((one) => one.check.id),
				metCount,
			}),
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("checks", () => {
	it("should find no defect in any check when it checks the references, the pairs and the units", () => {
		const expectedResult: string[] = [];

		const result = checks.flatMap(({ id, subject, threshold }) => {
			const against = threshold.kind === "figure" ? [threshold.against] : [];
			const isWindow = subject.at?.kind === "lastFiscalYears";
			return [
				...[subject, ...against]
					.filter((ref) => !isValidFigureRef(ref))
					.map((ref) => `${id}: ${ref.key} is not a valid reference`),
				...(isWindow !== (threshold.kind === "periodCount")
					? [`${id}: a window goes with a period count only`]
					: []),
				...against
					.filter((ref) => unitOf(ref) !== unitOf(subject))
					.map((ref) => `${id}: ${ref.key} has another unit`),
			];
		});

		expect(result).toEqual(expectedResult);
	});
});

describe("evaluateCheck", () => {
	it("should read not met for V2 when the free cash flow yield is below the Treasury yield now", () => {
		const sections = completed;

		// The free cash flow yield 348M ÷ (84.2 × 151.1M) = 2.7% is not above 4.25%.
		const expectedResult = { state: "notMet", reason: null };

		const result = outcomeOf("V2", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should read not enough data with reason missingSection for V2 when the valuation section has not loaded", () => {
		const sections = completeSections({
			...fakeCompanyReport,
			valuation: null,
		});

		const expectedResult = { state: "notEnoughData", reason: "missingSection" };

		const result = outcomeOf("V2", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should read not enough data with reason missingSection when the financials have not loaded", () => {
		const sections = completeSections({
			...fakeCompanyReport,
			financials: null,
		});

		const expectedResult = { state: "notEnoughData", reason: "missingSection" };

		const result = outcomeOf("B2", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the equity claim when P2 fails the equity guard of the return on equity", () => {
		const sections = sectionsWith([
			"balance",
			"quarterly",
			"shareholdersEquity",
			[7],
			-2_000_000_000,
		]);

		// Equity of −2.0B is not above 0, so the return on equity has no reading.
		const expectedResult = {
			state: "notEnoughData",
			reason: "failedGuard",
			claims: ["financials.shareholdersEquity.Q4-2025-12-31"],
		};

		const check = checks.find((candidate) => candidate.id === "P2");
		const outcome = check && evaluateCheck(check, sections);
		const result = outcome && {
			state: outcome.state,
			reason: outcome.reason,
			claims: outcome.claims.map((claim) => claim.id),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should read not met for S3 when a loss-making company pays dividends above a negative free cash flow", () => {
		const sections = sectionsWith([
			"cashFlow",
			"annual",
			"operatingCashFlow",
			[9],
			-1_868_000_000,
		]);

		// Free cash flow is −1,868M − 132M = −2.0B. Dividends of 66M are not at most −2.0B.
		const expectedResult = { state: "notMet", reason: null };

		const result = outcomeOf("S3", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should read a short history before a failed guard when V1 has both a loss year and too few years for the median", () => {
		const sections = sectionsWith(
			["income", "annual", "dilutedEps", [0, 1, 2, 3, 4, 5], null],
			["income", "annual", "dilutedEps", [9], -1.2],
		);

		// The P/E fails its EPS guard. The median has FY2022 to FY2024 only, 3 of the 5 points it needs.
		const expectedResult = { state: "notEnoughData", reason: "shortHistory" };

		const result = outcomeOf("V1", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should read not enough data with reason missingInput for S3 when the dividends paid are not a number", () => {
		const sections = sectionsWith([
			"cashFlow",
			"annual",
			"dividendsPaid",
			[9],
			"66,000,000",
		]);

		// Number("66,000,000") is NaN, so the dividends cannot be compared with free cash flow.
		const expectedResult = { state: "notEnoughData", reason: "missingInput" };

		const result = outcomeOf("S3", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should count a point that is not a number as unknown for C1 when two other years are negative", () => {
		const sections = sectionsWith(
			["cashFlow", "annual", "operatingCashFlow", [0, 1], 0],
			["cashFlow", "annual", "operatingCashFlow", [2], Number.NaN],
		);

		// Seven years are above 0 and one is unknown, so k + m = 8 is at least 8.
		const expectedResult = { state: "notEnoughData", reason: "shortHistory" };

		const result = outcomeOf("C1", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should read not enough data with reason missingInput when a period count check has a subject that is not a window", () => {
		const sections = completed;
		const c1 = checks.find((candidate) => candidate.id === "C1");
		const check: Check | undefined = c1 && {
			...c1,
			subject: {
				from: "metric",
				key: "freeCashFlow",
				at: { kind: "fiscalYear", yearsBack: 0 },
			},
		};

		// Free cash flow in FY2025 is one figure, so there are no years to count.
		const expectedResult = { state: "notEnoughData", reason: "missingInput" };

		const outcome = check && evaluateCheck(check, sections);
		const result = outcome && { state: outcome.state, reason: outcome.reason };

		expect(result).toEqual(expectedResult);
	});

	// Note §7 S1: the annual table has no column five years back.
	it("should read not enough data with reason missingInput for S1 when the annual table has no FY2020 column", () => {
		const sections = sectionsWithoutYear(4);

		// FY2025 is five years after FY2020, so the threshold figure is null.
		const expectedResult = { state: "notEnoughData", reason: "missingInput" };

		const result = outcomeOf("S1", sections);

		expect(result).toEqual(expectedResult);
	});

	// Note §7 S2 and V2: a share count that goes negative gives a negative market cap.
	it("should read not enough data with reason failedGuard for S2 when the market cap is negative", () => {
		const sections = sectionsWith([
			"income",
			"annual",
			"dilutedShares",
			[9],
			-33_000_000,
		]);

		// The market cap is 84.2 × −33M = −2.8B, which is not above 0.
		const expectedResult = { state: "notEnoughData", reason: "failedGuard" };

		const result = outcomeOf("S2", sections);

		expect(result).toEqual(expectedResult);
	});

	it("should read not enough data with reason failedGuard for V2 when the market cap is negative", () => {
		const sections = sectionsWith([
			"income",
			"annual",
			"dilutedShares",
			[9],
			-33_000_000,
		]);

		// The market cap is 84.2 × −33M = −2.8B, which is not above 0.
		const expectedResult = { state: "notEnoughData", reason: "failedGuard" };

		const result = outcomeOf("V2", sections);

		expect(result).toEqual(expectedResult);
	});

	// The four companies of note §7 C1. The fixture has free cash flow above 0 in all ten years.
	it.each<[string, Edit[], { state: string; reason: string | null }]>([
		// Operating cash flow 0 in FY2016 gives 0 − 72M, so k = 9 and m = 0.
		[
			"one negative year",
			[["cashFlow", "annual", "operatingCashFlow", [0], 0]],
			{ state: "met", reason: null },
		],
		// Four years with operating cash flow 0, so k = 6 and m = 0.
		[
			"four negative years",
			[["cashFlow", "annual", "operatingCashFlow", [0, 1, 2, 3], 0]],
			{ state: "notMet", reason: null },
		],
		// Seven years with no figure, so k = 3 and m = 7. k + m = 10 is at least 8.
		[
			"three listed years",
			[
				[
					"cashFlow",
					"annual",
					"operatingCashFlow",
					[0, 1, 2, 3, 4, 5, 6],
					null,
				],
			],
			{ state: "notEnoughData", reason: "shortHistory" },
		],
		// FY2019 has no capital expenditure, so its free cash flow is missing: k = 9, m = 1.
		[
			"FY2019 capital expenditure missing",
			[["cashFlow", "annual", "capitalExpenditure", [3], null]],
			{ state: "met", reason: null },
		],
	])(
		"should count the years for C1 when the company has %s",
		(_, edits, expectedResult) => {
			const sections = sectionsWith(...edits);

			const result = outcomeOf("C1", sections);

			expect(result).toEqual(expectedResult);
		},
	);
});
