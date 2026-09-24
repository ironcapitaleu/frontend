import { describe, expect, it } from "vitest";

import { fakeCompanyReport } from "../../test/fixtures/companies/fake-company-report";
import { completeSections } from "./metrics";
import type { CompanySections } from "./types";

describe("completeSections", () => {
	it("should keep every section unchanged when the quarters are not yet completed", () => {
		const sections: CompanySections = fakeCompanyReport;

		const expectedResult = structuredClone(fakeCompanyReport);

		const result = completeSections(sections);

		expect(result).toEqual(expectedResult);
	});

	it("should keep the unloaded section null when one section has not loaded", () => {
		const sections: CompanySections = { ...fakeCompanyReport, overview: null };

		const expectedResult = structuredClone(sections);

		const result = completeSections(sections);

		expect(result).toEqual(expectedResult);
	});

	it("should return a new object when given the sections of the port", () => {
		const sections: CompanySections = fakeCompanyReport;

		const expectedResult = false;

		const result = completeSections(sections) === sections;

		expect(result).toBe(expectedResult);
	});
});
