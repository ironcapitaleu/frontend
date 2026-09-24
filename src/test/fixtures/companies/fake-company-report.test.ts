import { describe, expect, it } from "vitest";

import { sourcesOf } from "../../../lib/company/sources";
import type {
	Claim,
	InsiderHolding,
	MetricKey,
} from "../../../lib/company/types";
import { fakeCompanyReport } from "./fake-company-report";

/** Returns every accession number that the report's sources name. */
function accessionNumbersOf(report: unknown): string[] {
	const text = JSON.stringify(report);
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
	if ("id" in value && "source" in value) {
		return [value as Claim];
	}
	return Object.entries(value).flatMap(([key, child]) =>
		key === "sectorBenchmarks" ? [] : companyClaimsOf(child),
	);
}

/** Returns the rows of `insiders` without the claim ids, which each section sets under its own name. */
function insiderRowsOf(insiders: readonly InsiderHolding[]) {
	return insiders.map(({ name, role, shares }) => ({
		name,
		role,
		shares: shares === null ? null : { ...shares, id: null },
	}));
}

describe("fakeCompanyReport", () => {
	it("should give every filing an accession number in the SEC form when the report is built", () => {
		const accessionNumbers = accessionNumbersOf(fakeCompanyReport);

		const expectedResult: string[] = [];

		const result = accessionNumbers.filter(
			(accessionNumber) => !/^\d{10}-\d{2}-\d{6}$/.test(accessionNumber),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should list every filing that a company claim cites when the Filings section is built", () => {
		const { filings, ...sections } = fakeCompanyReport;
		const listed = filings.filings.map((filing) => filing.accessionNumber);

		const expectedResult: string[] = [];

		const result = sourcesOf(companyClaimsOf(sections))
			.groups.map(({ document }) => document)
			.filter((document) => document.kind === "filing")
			.map((document) => document.accessionNumber)
			.filter((accessionNumber) => !listed.includes(accessionNumber));

		expect(result).toEqual(expectedResult);
	});

	it("should name no metric in both lists when the Overview and Valuation benchmarks are compared", () => {
		const { overview, valuation } = fakeCompanyReport;
		const overviewMetrics = overview.sectorBenchmarks.map((row) => row.metric);

		const expectedResult: MetricKey[] = [];

		const result = valuation.sectorBenchmarks
			.map((row) => row.metric)
			.filter((metric) => overviewMetrics.includes(metric));

		expect(result).toEqual(expectedResult);
	});

	it("should hold the same insider rows in the same order when the Relationships and Management sections are compared", () => {
		const { relationships, management } = fakeCompanyReport;

		const expectedResult = insiderRowsOf(management.insiders);

		const result = insiderRowsOf(relationships.insiders);

		expect(result).toEqual(expectedResult);
	});
});
