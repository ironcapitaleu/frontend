import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "./fake-company-report";

/** Returns every accession number that the report's sources name. */
function accessionNumbersOf(report: unknown): string[] {
	const text = JSON.stringify(report);
	return [...text.matchAll(/"accessionNumber":"([^"]*)"/g)].map(
		([, accessionNumber]) => accessionNumber,
	);
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
});
