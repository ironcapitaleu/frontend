import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { fakeCompanySearchResults } from "../test/fixtures/companies/fake-company-search-results";
import { render, screen } from "../test/render";
import CompanySearch from "./CompanySearch";

/** The search field, found by its placeholder. */
function searchField(): HTMLElement {
	return screen.getByPlaceholderText(/company name or symbol/i);
}

/** The Search button in the search bar. */
function searchButton(): HTMLElement {
	return screen.getByRole("button", { name: /^search/i });
}

describe("CompanySearch", () => {
	it("should show the search prompt when no query has been entered", () => {
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "Search for Companies";

		const result = screen.getByRole("heading", {
			name: /search for companies/i,
		}).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should keep the Search button disabled before a query is entered", () => {
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = true;

		const result = (searchButton() as HTMLButtonElement).disabled;

		expect(result).toBe(expectedResult);
	});

	it("should show the matching company's detail when a name query is searched", async () => {
		const user = userEvent.setup();
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "Alfa Aviation";

		await user.type(searchField(), "Aviation");
		await user.click(searchButton());
		const result = (await screen.findByText("Alfa Aviation")).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the matching company's detail when a symbol query is searched", async () => {
		const user = userEvent.setup();
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "Bravo Biotech";

		await user.type(searchField(), "BRVO");
		await user.click(searchButton());
		const result = (await screen.findByText("Bravo Biotech")).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the no-results message when the query matches no company", async () => {
		const user = userEvent.setup();
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "No results found";

		await user.type(searchField(), "ZZZZ");
		await user.click(searchButton());
		const result = (
			await screen.findByRole("heading", { name: /no results found/i })
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the selected company's website link when it has a website", async () => {
		const user = userEvent.setup();
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "https://www.alfa-aviation.example";

		await user.type(searchField(), "Aviation");
		await user.click(searchButton());
		const result = (
			await screen.findByRole("link", { name: /visit alfa aviation website/i })
		).getAttribute("href");

		expect(result).toBe(expectedResult);
	});

	it("should run the search when Enter is pressed in the search field", async () => {
		const user = userEvent.setup();
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "Crux Systems";

		await user.type(searchField(), "Crux{Enter}");
		const result = (await screen.findByText("Crux Systems")).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should populate the search field when a quick-search suggestion is chosen", async () => {
		const user = userEvent.setup();
		render(<CompanySearch companies={fakeCompanySearchResults} />);

		const expectedResult = "AAPL";

		await user.click(screen.getByRole("button", { name: /apple/i }));
		const result = (searchField() as HTMLInputElement).value;

		expect(result).toBe(expectedResult);
	});
});
