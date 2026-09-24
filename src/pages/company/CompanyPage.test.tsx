import userEvent from "@testing-library/user-event";
import { useLocation, useNavigationType } from "react-router";
import { describe, expect, it } from "vitest";

import App from "../../App";
import { alwaysFailingCompanyGateway } from "../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../test/fixtures/companies/always-found";
import { alwaysMissingCompanyGateway } from "../../test/fixtures/companies/always-missing";
import { render, screen, within } from "../../test/render";

const MISSING_TITLE = "We found no company at this address.";
const MISSING_TAB_TITLE = "The company page has no such tab.";

/** Shows how the router reached its current entry, for the redirect tests. */
function LocationProbe() {
	const { pathname } = useLocation();
	const navigationType = useNavigationType();
	return (
		<output aria-label="Location">{`${navigationType} ${pathname}`}</output>
	);
}

describe("CompanyPage", () => {
	it("should show the loading state when the masthead has not loaded yet", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = "Loading company";

		const result = screen.getByRole("status").getAttribute("aria-label");
		await screen.findByRole("heading", { level: 1 });

		expect(result).toBe(expectedResult);
	});

	it("should show the company name as the page heading when the masthead loads at the symbol route", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = "Quillvane Instruments, Inc.";

		const result = (await screen.findByRole("heading", { level: 1 }))
			.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should mark the Overview tab as the current page when the masthead loads at the symbol route", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = "Overview";

		const tabs = await screen.findByRole("navigation", {
			name: "Company sections",
		});
		const result = within(tabs)
			.getAllByRole("link")
			.find(
				(link) => link.getAttribute("aria-current") === "page",
			)?.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should mark the Shareholder returns tab as the current page when the masthead loads at the returns route", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/returns"],
		});

		const expectedResult = "Shareholder returns";

		const tabs = await screen.findByRole("navigation", {
			name: "Company sections",
		});
		const result = within(tabs)
			.getAllByRole("link")
			.find(
				(link) => link.getAttribute("aria-current") === "page",
			)?.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should name the tab in its empty panel when the masthead loads at the returns route", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/returns"],
		});

		const expectedResult = "The Shareholder returns tab has no content yet.";

		const result = (
			await screen.findByRole("region", { name: "Shareholder returns" })
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should link each tab to its URL when the masthead loads", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = [
			"/companies/MRDN",
			"/companies/MRDN/financials",
			"/companies/MRDN/valuation",
			"/companies/MRDN/returns",
			"/companies/MRDN/relationships",
			"/companies/MRDN/management",
			"/companies/MRDN/filings",
		];

		const tabs = await screen.findByRole("navigation", {
			name: "Company sections",
		});
		const result = within(tabs)
			.getAllByRole("link")
			.map((link) => link.getAttribute("href"));

		expect(result).toEqual(expectedResult);
	});

	it("should open the Valuation tab when the reader follows its link", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});
		const user = userEvent.setup();

		const expectedResult =
			"3.1 Ratios Against Their Own Ten Years and the Sector";

		await user.click(await screen.findByRole("link", { name: "Valuation" }));
		const result = (
			await within(
				await screen.findByRole("region", { name: "Valuation" }),
			).findByRole("heading", { level: 3, name: /^3\.1/ })
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the missing state when the gateway knows no company", async () => {
		render(<App />, {
			companyGateway: alwaysMissingCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = MISSING_TITLE;

		const result = await screen.findByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should show the missing state when the symbol is not a valid ticker", () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MR..DN"],
		});

		const expectedResult = MISSING_TITLE;

		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should show the no-such-tab state when the tab is not one of the seven tabs", () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/news"],
		});

		const expectedResult = MISSING_TAB_TITLE;

		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should link to the company's Overview when the tab is not one of the seven tabs", () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/news"],
		});

		const expectedResult = "/companies/MRDN";

		const result = screen
			.getByRole("link", { name: "Open the overview" })
			.getAttribute("href");

		expect(result).toBe(expectedResult);
	});

	it("should show the missing state when the symbol is invalid and the tab is unknown", () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MR..DN/news"],
		});

		const expectedResult = MISSING_TITLE;

		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should replace the URL with the symbol route when the tab segment is overview", async () => {
		render(
			<>
				<App />
				<LocationProbe />
			</>,
			{
				companyGateway: alwaysFoundCompanyGateway(),
				initialEntries: ["/companies/MRDN/overview"],
			},
		);

		const expectedResult = "REPLACE /companies/MRDN";

		await screen.findByRole("heading", { level: 1 });
		const result = screen.getByRole("status", { name: "Location" }).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should replace the URL with the lower-case tab route when the tab segment has capitals", async () => {
		render(
			<>
				<App />
				<LocationProbe />
			</>,
			{
				companyGateway: alwaysFoundCompanyGateway(),
				initialEntries: ["/companies/MRDN/Financials"],
			},
		);

		const expectedResult = "REPLACE /companies/MRDN/financials";

		await screen.findByRole("heading", { level: 1 });
		const result = screen.getByRole("status", { name: "Location" }).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should mark the Financials tab as the current page when the tab segment has capitals", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/Financials"],
		});

		const expectedResult = "Financials";

		const tabs = await screen.findByRole("navigation", {
			name: "Company sections",
		});
		const result = within(tabs)
			.getAllByRole("link")
			.find(
				(link) => link.getAttribute("aria-current") === "page",
			)?.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the failed state when the masthead request fails", async () => {
		render(<App />, {
			companyGateway: alwaysFailingCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = "The company data did not load.";

		const result = await screen.findByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});
});
