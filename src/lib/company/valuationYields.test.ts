import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { completeSections } from "./metrics";
import { yieldTable } from "./valuationYields";

const sections = completeSections(fakeCompanyReport);

const { masthead, financials } = fakeCompanyReport;

describe("yieldTable", () => {
	it("should give a column for each of the ten fiscal year ends and a last column for now when every section has loaded", () => {
		const years = financials.income.annual.periods.slice(-10);

		const expectedResult = [...years.map(({ endsOn }) => endsOn), "now"];

		const result = yieldTable(sections).columns.map(({ key }) => key);

		expect(result).toEqual(expectedResult);
	});

	it("should label each column with its full and short name when every section has loaded", () => {
		const years = financials.income.annual.periods.slice(-10);

		const expectedResult = [
			...years.map(({ fiscalYear }) => ({
				label: `FY${fiscalYear}`,
				short: `FY${String(fiscalYear).slice(-2)}`,
			})),
			{ label: "Now", short: "Now" },
		];

		const result = yieldTable(sections).columns.map(({ label, short }) => ({
			label,
			short,
		}));

		expect(result).toEqual(expectedResult);
	});

	it("should give null for the earnings yield of a year when its year-end price is missing", () => {
		const prices = masthead.priceAtFiscalYearEnds;
		const noPrice = completeSections({
			...fakeCompanyReport,
			masthead: {
				...masthead,
				priceAtFiscalYearEnds: {
					...prices,
					points: prices.points.map((point, index) =>
						index === 4 ? null : point,
					),
				},
			},
		});

		const expectedResult = null;

		const result = yieldTable(noPrice).lines.find(
			({ key }) => key === "earningsYield",
		)?.points[4];

		expect(result).toBe(expectedResult);
	});
});
