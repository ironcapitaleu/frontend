import { useLocation, useNavigationType } from "react-router";
import { describe, expect, it } from "vitest";

import App from "../../App";
import { alwaysFailingCompanyGateway } from "../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../test/fixtures/companies/always-found";
import { alwaysMissingCompanyGateway } from "../../test/fixtures/companies/always-missing";
import { render, screen } from "../../test/render";

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
	it("should show the loading state when the masthead has not loaded yet", () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = "Loading company";

		const result = screen.getByRole("status");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should name the company and the Overview tab when the masthead loads at the symbol route", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN"],
		});

		const expectedResult = {
			company: "Quillvane Instruments, Inc.",
			tab: "Overview",
		};

		const heading = await screen.findByRole("heading", { level: 1 });
		const result = {
			company: heading.textContent,
			tab: heading.nextElementSibling?.textContent,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should name the Shareholder returns tab when the masthead loads at the returns route", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/returns"],
		});

		const expectedResult = "Shareholder returns";

		const heading = await screen.findByRole("heading", { level: 1 });
		const result = heading.nextElementSibling;

		expect(result).toHaveTextContent(expectedResult);
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

	it("should replace the URL with the symbol route when the tab segment is overview", () => {
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

		const result = screen.getByRole("status", { name: "Location" });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should replace the URL with the lower-case tab route when the tab segment has capitals", () => {
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

		const result = screen.getByRole("status", { name: "Location" });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should name the Financials tab when the tab segment has capitals", async () => {
		render(<App />, {
			companyGateway: alwaysFoundCompanyGateway(),
			initialEntries: ["/companies/MRDN/Financials"],
		});

		const expectedResult = "Financials";

		const heading = await screen.findByRole("heading", { level: 1 });
		const result = heading.nextElementSibling;

		expect(result).toHaveTextContent(expectedResult);
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
