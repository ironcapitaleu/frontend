import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { completeSections, evaluateMetric } from "./metrics";
import type { Claim } from "./types";
import { ratioRanges, ratioScale } from "./valuationRatios";

const { masthead } = fakeCompanyReport;
const sections = completeSections(fakeCompanyReport);
const [pe, , pb] = ratioRanges(sections);

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

	it("should leave the own range missing when fewer than two years have a year-end price", () => {
		const series = masthead.priceAtFiscalYearEnds;
		const short = completeSections({
			...fakeCompanyReport,
			masthead: {
				...masthead,
				priceAtFiscalYearEnds: {
					...series,
					points: series.points.map((point, index) => (index ? null : point)),
				},
			},
		});

		const expectedResult = { low: null, high: null };

		const [result] = ratioRanges(short).map(({ ownLow, ownHigh }) => ({
			low: ownLow,
			high: ownHigh,
		}));

		expect(result).toEqual(expectedResult);
	});

	it("should leave the own range of P/B missing when no year-end P/B metric exists", () => {
		const expectedResult = [null, null, null];

		const result = [pb.ownLow, pb.ownMedian, pb.ownHigh];

		expect(result).toEqual(expectedResult);
	});
});

describe("ratioScale", () => {
	it("should span the lowest and highest known figure when the figure now sits outside the own range", () => {
		const range = {
			...pe,
			now: figure(50),
			ownLow: figure(10),
			ownHigh: figure(30),
			sector: null,
		};

		const expectedResult = [10, 50];

		const result = ratioScale(range);

		expect(result).toEqual(expectedResult);
	});
});
