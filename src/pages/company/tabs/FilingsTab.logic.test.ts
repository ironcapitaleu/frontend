import { describe, expect, it } from "vitest";

import { completeSections } from "@/lib/company/metrics";
import { meridianFilingsSection } from "@/lib/company/sample/filings";
import { meridianFinancials } from "@/lib/company/sample/financials";
import { meridianManagement } from "@/lib/company/sample/management";
import { meridianMasthead } from "@/lib/company/sample/masthead";
import { meridianOverview } from "@/lib/company/sample/overview";
import { meridianRelationships } from "@/lib/company/sample/relationships";
import { meridianShareholderReturns } from "@/lib/company/sample/shareholderReturns";
import { meridianValuation } from "@/lib/company/sample/valuation";
import type { CompanySections } from "@/lib/company/types";
import { fedFiguresOf, filedOnText, filingsGroupsOf } from "./FilingsTab.logic";

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
});

describe("filedOnText", () => {
	it("should print the day, month and year when the date is valid", () => {
		const expectedResult = "12 Mar 2026";

		const result = filedOnText("2026-03-12");

		expect(result).toBe(expectedResult);
	});

	it.each(["", "12/03/2026", "2026-02-30", "2026-13-01"])(
		"should give the dash when the date is %j",
		(date) => {
			const expectedResult = "—";

			const result = filedOnText(date);

			expect(result).toBe(expectedResult);
		},
	);
});
