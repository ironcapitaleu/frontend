import { describe, expect, it } from "vitest";

import { completeSections } from "@/lib/company/metrics";
import { fakeCompanyReport } from "@/test/fixtures/companies/fake-company-report";
import {
	formatInUnit,
	revenueParts,
	tenYearsSeries,
} from "./OverviewTab.logic";

const { overview, financials } = fakeCompanyReport;
const sections = completeSections(fakeCompanyReport);

/** The value of the latest point of `line` in the annual income statement. */
function latestIncome(key: string): number {
	const line = financials.income.annual.lines.find((each) => each.key === key);
	return Number(line?.points.at(-1)?.value);
}

describe("revenueParts", () => {
	it("should give each part the claim of its share of revenue when the list is the regions", () => {
		const expectedResult = "metric.revenueShare.regions.0";

		const result = revenueParts(overview, "regions")[0]?.share?.id;

		expect(result).toBe(expectedResult);
	});
});

describe("tenYearsSeries", () => {
	it("should give no series when Financials has not loaded", () => {
		const expectedResult: unknown[] = [];

		const result = tenYearsSeries(
			completeSections({ ...fakeCompanyReport, financials: null }),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give revenue, operating margin, free cash flow and diluted shares in that order when Financials has loaded", () => {
		const expectedResult = [
			"Revenue",
			"Operating margin",
			"Free cash flow",
			"Diluted shares",
		];

		const result = tenYearsSeries(sections).map(({ label }) => label);

		expect(result).toEqual(expectedResult);
	});

	it("should divide operating income by revenue when it computes the latest operating margin", () => {
		const expectedResult =
			latestIncome("operatingIncome") / latestIncome("revenue");

		const result = tenYearsSeries(sections)[1]?.points.at(-1)?.value;

		expect(result).toBeCloseTo(expectedResult);
	});

	it("should give a missing point when a year lacks the cash flow lines that its free cash flow reads", () => {
		const { cashFlow } = financials;
		const noCashFlow = {
			...financials,
			cashFlow: { ...cashFlow, annual: { ...cashFlow.annual, lines: [] } },
		};

		const expectedResult = null;

		const result = tenYearsSeries(
			completeSections({ ...fakeCompanyReport, financials: noCashFlow }),
		)[2]?.points[0];

		expect(result).toBe(expectedResult);
	});
});

describe("formatInUnit", () => {
	it.each([
		[212_000_000_000, "$212.0B", "usd"],
		[-4_000_000_000, "−$4.0B", "usd"],
		[24_500_000_000, "24.5B", "shares"],
		[0.312, "31.2%", "percent"],
	] as const)(
		"should write %s as %s when the unit is %s",
		(value, expectedResult, unit) => {
			const result = formatInUnit(value, unit);

			expect(result).toBe(expectedResult);
		},
	);
});
