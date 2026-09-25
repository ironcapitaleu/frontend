import { describe, expect, it } from "vitest";

import { completeSections } from "@/lib/company/metrics";
import { isoDate } from "@/lib/company/sample/calendar";
import { meridianFilingsSection } from "@/lib/company/sample/filings";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { meridianManagement } from "@/lib/company/sample/management";
import { meridianMasthead } from "@/lib/company/sample/masthead";
import { meridianOverview } from "@/lib/company/sample/overview";
import { meridianRelationships } from "@/lib/company/sample/relationships";
import { meridianShareholderReturns } from "@/lib/company/sample/shareholderReturns";
import { meridianValuation } from "@/lib/company/sample/valuation";
import type { CompanySections, Filing, FilingForm } from "@/lib/company/types";
import {
	fedFiguresOf,
	filingsGroupsOf,
	filingsOfForm,
	formCountsOf,
} from "./FilingsTab.logic";

/** The made-up accession number of the MRDN 10-K for FY2026 (data-model note §7). */
const TEN_K_FY2026 = "0001234567-26-000012";

const meridian: CompanySections = {
	masthead: meridianMasthead,
	overview: meridianOverview,
	financials: meridianFinancials,
	valuation: meridianValuation,
	shareholderReturns: meridianShareholderReturns,
	relationships: meridianRelationships,
	management: meridianManagement,
	filings: meridianFilingsSection,
};

/** A filing of type `form` filed on `filedOn`, the rest made up. */
function filingOf(form: FilingForm, filedOn: string): Filing {
	return {
		kind: "filing",
		form,
		filer: "Meridian",
		accessionNumber: `${form}-${filedOn}`,
		filedOn: isoDate(filedOn),
		periodLabel: "FY2026",
		indexUrl: "https://edgar.example/",
	};
}

/** Four filings, newest first: two 8-Ks around a 10-K, then a 10-Q. */
const newestFirst = [
	filingOf("8-K", "2026-09-01"),
	filingOf("10-K", "2026-08-01"),
	filingOf("8-K", "2026-07-01"),
	filingOf("10-Q", "2026-06-01"),
];

/** The blocks that the FY2026 10-K row names, when `sections` have loaded. */
function tenKBlocks(sections: CompanySections): string[] {
	const groups = filingsGroupsOf(completeSections(sections));
	return (fedFiguresOf(groups).get(TEN_K_FY2026) ?? []).map(
		({ ref }) => ref.block,
	);
}

describe("fedFiguresOf", () => {
	// The worked example also names "Checks by Area", which reads no figure
	// until the checks land.
	it("should name the income statement table and the subsidiaries when the FY2026 10-K row is built from every section", () => {
		const expectedResult = ["incomeTable", "subsidiaries"];

		const result = tenKBlocks(meridian).filter((block) =>
			expectedResult.includes(block),
		);

		expect(result).toEqual(expectedResult);
	});

	it("should leave the pay mix out when the FY2026 10-K row is built, since CEO pay reads the DEF 14A", () => {
		const expectedResult = false;

		const result = tenKBlocks(meridian).includes("payMix");

		expect(result).toBe(expectedResult);
	});

	it("should leave the subsidiaries out when the Relationships section has not loaded", () => {
		const expectedResult = false;

		const result = tenKBlocks({ ...meridian, relationships: null }).includes(
			"subsidiaries",
		);

		expect(result).toBe(expectedResult);
	});

	it("should name neither Who Owns It nor Profile when the rows are built from every section, since no card draws them yet", () => {
		const expectedResult: string[] = [];

		const result = [
			...fedFiguresOf(filingsGroupsOf(completeSections(meridian))).values(),
		]
			.flat()
			.map(({ ref }) => ref.label)
			.filter((label) => label === "Who Owns It" || label === "Profile");

		expect(result).toEqual(expectedResult);
	});
});

describe("formCountsOf", () => {
	it("should count the filings of each type in the order of the forms when the newest filing is an 8-K", () => {
		const expectedResult = [
			{ form: "10-K", count: 1 },
			{ form: "10-Q", count: 1 },
			{ form: "8-K", count: 2 },
		];

		const result = formCountsOf(newestFirst);

		expect(result).toEqual(expectedResult);
	});

	it("should give no chip to a type when no filing has it", () => {
		const expectedResult = false;

		const result = formCountsOf(newestFirst).some(
			({ form }) => form === "DEF 14A",
		);

		expect(result).toBe(expectedResult);
	});
});

describe("filingsOfForm", () => {
	it("should keep only the 8-Ks, newest first, when the 8-K chip is selected", () => {
		const expectedResult = ["8-K-2026-09-01", "8-K-2026-07-01"];

		const result = filingsOfForm(newestFirst, "8-K").map(
			({ accessionNumber }) => accessionNumber,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should keep every filing when no chip is selected", () => {
		const expectedResult = newestFirst;

		const result = filingsOfForm(newestFirst, null);

		expect(result).toEqual(expectedResult);
	});
});
