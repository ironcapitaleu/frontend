import { describe, expect, it } from "vitest";

import { completeSections, type PositionRow } from "@/lib/company/metrics";
import type { Claim, OverviewSection } from "@/lib/company/types";
import { fakeCompanyReport } from "@/test/fixtures/companies/fake-company-report";
import type { CompanySectionKey, CompanyState } from "@/hooks/useCompany";
import { MissingCompany } from "@/lib/company/errors";
import { Ticker } from "@/lib/domain/ticker";
import {
	heldBack,
	joinSections,
	positionBars,
	revenueParts,
	tenYearsSeries,
} from "./OverviewTab.logic";

const { overview, financials } = fakeCompanyReport;
const sections = completeSections(fakeCompanyReport);

/** The overview with seven segments, named A to G, of 1 to 7 dollars of revenue. */
const sevenSegments: OverviewSection = {
	...overview,
	segments: [..."ABCDEFG"].map((name, index) => {
		const revenue = overview.segments[0]?.revenue as Claim;
		return {
			name,
			revenue: { ...revenue, id: `segments.${name}`, value: index + 1 },
		};
	}),
};

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

	it("should keep the first four parts and fold the rest into Other when the list has seven rows", () => {
		const expectedResult = ["A", "B", "C", "D", "Other"];

		const result = revenueParts(sevenSegments, "segments").map(
			({ label }) => label,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should give Other the revenue of the folded rows over all revenue as a derived share when the list has seven rows", () => {
		// (5 + 6 + 7) ÷ (1 + 2 + … + 7) = 18 ÷ 28.
		const expectedResult = {
			value: 18 / 28,
			formula:
				"(E revenue + F revenue + G revenue) ÷ (A revenue + B revenue + C revenue + D revenue + E revenue + F revenue + G revenue)",
			inputs: 7,
		};

		const other = revenueParts(sevenSegments, "segments")[4]?.share;
		const source = other?.source.kind === "derived" ? other.source : null;
		const result = {
			value: other?.value,
			formula: source?.formula,
			inputs: source?.inputs.length,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should keep every part when the list has five rows", () => {
		const five = {
			...sevenSegments,
			segments: sevenSegments.segments.slice(0, 5),
		};

		const expectedResult = ["A", "B", "C", "D", "E"];

		const result = revenueParts(five, "segments").map(({ label }) => label);

		expect(result).toEqual(expectedResult);
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

describe("joinSections", () => {
	const overviewOnly = completeSections({
		...fakeCompanyReport,
		financials: null,
	});
	const financialsOnly = completeSections({
		...fakeCompanyReport,
		overview: null,
	});

	it("should keep the loaded section of each load when a later load lacks it", () => {
		const expectedResult = { overview: true, financials: true };

		const joined = joinSections([overviewOnly, null, financialsOnly]);
		const result = {
			overview: joined?.overview === overviewOnly.overview,
			financials: joined?.financials === financialsOnly.financials,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should give null when no load holds sections", () => {
		const expectedResult = null;

		const result = joinSections([null, null]);

		expect(result).toBe(expectedResult);
	});
});

describe("heldBack", () => {
	const lead: CompanyState<"financials"> = {
		status: "loaded",
		data: sections.financials ?? financials,
		sections,
	};
	const loaded: CompanyState<CompanySectionKey> = lead;

	it("should be loading when the lead has loaded and another load is still loading", () => {
		const expectedResult = "loading";

		const result = heldBack(lead, [loaded, { status: "loading" }]).status;

		expect(result).toBe(expectedResult);
	});

	it("should be failed when the lead has loaded and another load finds no company", () => {
		const missing: CompanyState<"masthead"> = {
			status: "missing",
			error: new MissingCompany(Ticker.parse("XYZ")),
		};

		const expectedResult = "failed";

		const result = heldBack(lead, [missing]).status;

		expect(result).toBe(expectedResult);
	});

	it("should give the lead back when every load has loaded", () => {
		const expectedResult = lead;

		const result = heldBack(lead, [loaded]);

		expect(result).toBe(expectedResult);
	});
});

describe("positionBars", () => {
	const claim = financials.balance.quarterly.lines[0]?.points.at(-1) as Claim;
	/** The rows of card 1.4 with these short-term and then long-term assets and liabilities. */
	const rowsOf = (values: number[], unit = claim.unit): PositionRow[] =>
		(["Short term", "Long term"] as const).map((term, row) => ({
			term,
			assets: { ...claim, unit, value: values[row * 2] as number },
			liabilities: { ...claim, unit, value: values[row * 2 + 1] as number },
		}));

	it("should give a small figure the least height when it is under 1% of the highest", () => {
		const expectedResult = 2;

		const result = positionBars(rowsOf([1000, 1, 500, 500])).plots[0]?.[1]
			?.height;

		expect(result).toBe(expectedResult);
	});

	it("should draw the bar down from the zero line when a long-term figure is negative", () => {
		const expectedResult = { zero: 75, top: 75, height: 25 };

		const { plots, zero } = positionBars(rowsOf([3, 1, -1, 2]));
		const result = {
			zero,
			top: plots[1]?.[0]?.top,
			height: plots[1]?.[0]?.height,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should speak the value in the figure's unit when the unit is not dollars", () => {
		const expectedResult = "Short term assets: 5.0B";

		const result = positionBars(rowsOf([5e9, 1, 1, 1], "shares")).plots[0]?.[0]
			?.text;

		expect(result).toBe(expectedResult);
	});
});
