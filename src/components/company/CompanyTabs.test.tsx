import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import type { TabKey } from "@/lib/company/types";
import { CompanyTabs } from "./CompanyTabs";

function renderTabs(activeTab: TabKey) {
	render(
		<MemoryRouter>
			<CompanyTabs symbol="MRDN" activeTab={activeTab} />
		</MemoryRouter>,
	);
}

describe("CompanyTabs", () => {
	it("should link the seven tabs to their URLs in the order of the URL table when rendered for a symbol", () => {
		renderTabs("overview");

		const expectedResult = [
			["Overview", "/companies/MRDN"],
			["Financials", "/companies/MRDN/financials"],
			["Valuation", "/companies/MRDN/valuation"],
			["Shareholder returns", "/companies/MRDN/returns"],
			["Relationships", "/companies/MRDN/relationships"],
			["Management", "/companies/MRDN/management"],
			["Filings", "/companies/MRDN/filings"],
		];

		const result = screen
			.getAllByRole("link")
			.map((link) => [link.textContent, link.getAttribute("href")]);

		expect(result).toEqual(expectedResult);
	});

	it("should mark only the active tab as the current page when the active tab is valuation", () => {
		renderTabs("valuation");

		const expectedResult = ["Valuation"];

		const result = screen
			.getAllByRole("link")
			.filter((link) => link.getAttribute("aria-current") === "page")
			.map((link) => link.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should name its navigation landmark when rendered", () => {
		renderTabs("overview");

		const expectedResult = "Company sections";

		const result = screen.getByRole("navigation");

		expect(result).toHaveAccessibleName(expectedResult);
	});
});
