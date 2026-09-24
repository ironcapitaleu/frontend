import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { completeSections, evaluateMetric } from "./metrics";
import type { Claim } from "./types";
import {
	MIN_YEARS,
	type RatioRange,
	ratioRanges,
	ratioScale,
	valuationRatios,
} from "./valuationRatios";

const { masthead } = fakeCompanyReport;
const sections = completeSections(fakeCompanyReport);
const ranges = ratioRanges(sections);
const [pe] = ranges;

/** Returns the sections with a year-end price in the first `count` years only. */
function withYearEndPrices(count: number) {
	const series = masthead.priceAtFiscalYearEnds;
	return completeSections({
		...fakeCompanyReport,
		masthead: {
			...masthead,
			priceAtFiscalYearEnds: {
				...series,
				points: series.points.map((point, index) =>
					index < count ? point : null,
				),
			},
		},
	});
}

/** A range of the P/E with no figure known. */
const unknown: RatioRange = {
	...pe,
	now: null,
	ownLow: null,
	ownMedian: null,
	ownHigh: null,
	sector: null,
};

/** Returns a claim of the fixture that holds `value`. */
function figure(value: number): Claim {
	return { ...(pe.now as Claim), value };
}

describe("ratioRanges", () => {
	it("should take the lowest and highest year-end P/E as the own range when every year has earnings", () => {
		const values = fakeCompanyReport.financials.income.annual.periods.map(
			(year) => {
				const result = evaluateMetric(
					"priceToEarningsAtYearEnd",
					sections,
					year,
				);
				return result.kind === "value"
					? Number(result.claim.value)
					: Number.NaN;
			},
		);

		const expectedResult = [Math.min(...values), Math.max(...values)];

		const result = [pe.ownLow?.value, pe.ownHigh?.value];

		expect(result).toEqual(expectedResult);
	});

	it("should leave the own range missing when fewer than MIN_YEARS years have a year-end price", () => {
		const short = withYearEndPrices(MIN_YEARS - 1);

		const expectedResult = { low: null, high: null };

		const [result] = ratioRanges(short).map(({ ownLow, ownHigh }) => ({
			low: ownLow,
			high: ownHigh,
		}));

		expect(result).toEqual(expectedResult);
	});

	it("should draw the own range when exactly MIN_YEARS years have a year-end price", () => {
		const [range] = ratioRanges(withYearEndPrices(MIN_YEARS));

		const expectedResult = true;

		const result = range.ownLow !== null && range.ownHigh !== null;

		expect(result).toBe(expectedResult);
	});

	it("should give every ratio its own range and median when the fixture has ten years", () => {
		const expectedResult = valuationRatios.map(() => true);

		const result = ranges.map(
			({ ownLow, ownMedian, ownHigh }) =>
				ownLow !== null && ownMedian !== null && ownHigh !== null,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should read the figure now from the ratio metric when the ratio is the P/E", () => {
		const expectedResult = evaluateMetric("priceToEarnings", sections);

		const result = { kind: "value", claim: pe.now };

		expect(result).toEqual(expectedResult);
	});

	it("should read the own median from the 10-year median metric when the ratio is the P/E", () => {
		const expectedResult = evaluateMetric("priceToEarningsMedian10y", sections);

		const result = { kind: "value", claim: pe.ownMedian };

		expect(result).toEqual(expectedResult);
	});

	it("should take each ratio's sector quartiles from the Valuation benchmarks when the section has loaded", () => {
		const expectedResult = [...valuationRatios];

		const result = ranges.map(({ sector }) => sector?.metric);

		expect(result).toEqual(expectedResult);
	});
});

describe("ratioScale", () => {
	it("should span the lowest and highest known figure when the figure now sits outside the own range", () => {
		const range = {
			...pe,
			now: figure(50),
			ownLow: figure(10),
			ownMedian: figure(20),
			ownHigh: figure(30),
			sector: null,
		};

		const expectedResult = [10, 50];

		const result = ratioScale(range);

		expect(result).toEqual(expectedResult);
	});

	it("should span the sector quartiles when they reach past the own range", () => {
		const range = {
			...unknown,
			ownLow: figure(10),
			ownHigh: figure(30),
			sector: pe.sector && {
				...pe.sector,
				lowerQuartile: figure(5),
				median: figure(20),
				upperQuartile: figure(60),
			},
		};

		const expectedResult = [5, 60];

		const result = ratioScale(range);

		expect(result).toEqual(expectedResult);
	});

	it("should include the own median when it is the highest known figure", () => {
		const range = { ...unknown, now: figure(12), ownMedian: figure(18) };

		const expectedResult = [12, 18];

		const result = ratioScale(range);

		expect(result).toEqual(expectedResult);
	});

	it("should give no scale when no figure is known", () => {
		const expectedResult = null;

		const result = ratioScale(unknown);

		expect(result).toBe(expectedResult);
	});
});
