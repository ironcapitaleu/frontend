import { describe, expect, it } from "vitest";

import { COMPANY_TABS } from "../../../lib/company/tabs";
import { TAB_PANELS } from "./index";

describe("TAB_PANELS", () => {
	it("should give each tab the panel named after it when every tab is read", () => {
		const expectedResult = [
			"OverviewTab",
			"FinancialsTab",
			"ValuationTab",
			"ShareholderReturnsTab",
			"RelationshipsTab",
			"ManagementTab",
			"FilingsTab",
		];

		const result = COMPANY_TABS.map(({ key }) => TAB_PANELS[key].name);

		expect(result).toEqual(expectedResult);
	});
});
