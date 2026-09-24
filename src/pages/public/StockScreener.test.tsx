import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "../../test/fixtures/stocks/fake-stock-screener-results";
import { render, screen, waitFor, within } from "../../test/render";
import StockScreener from "./StockScreener";

/** The result count the reader sees, for example "5 of 5 companies". */
function resultCount(): string {
	return screen.getByText(/of \d+ companies/).parentElement?.textContent ?? "";
}

/** The symbols of the table rows, top to bottom. */
function tableSymbols(): string[] {
	const table = screen.getByRole("table");
	return within(table)
		.queryAllByRole("button", { name: /·/ })
		.map((button) => button.querySelector("span")?.textContent ?? "");
}

describe("StockScreener", () => {
	it("should count every injected stock when no filter is applied", () => {
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "5 of 5 companies";

		const result = resultCount();

		expect(result).toBe(expectedResult);
	});

	it("should show only the rows matching the search term when a search is typed", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = ["BETA"];

		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"Beta",
		);
		const result = tableSymbols();

		expect(result).toEqual(expectedResult);
	});

	it("should show the empty-state message in the table and the card list when no row matches the search", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		// Both layouts render in jsdom, so each one carries the message.
		const expectedResult = 2;

		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"ZZZZ",
		);
		const result = screen.queryAllByText(
			"No companies match these filters.",
		).length;

		expect(result).toBe(expectedResult);
	});

	it("should apply a strategy and mark it pressed when its button is clicked", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);
		const preset = screen.getByRole("button", {
			name: "Income at a fair price",
		});

		const expectedResult = {
			pressed: "true",
			count: "2 of 5 companies",
			rows: ["BETA", "OMEGA"],
		};

		await user.click(preset);
		const result = {
			pressed: preset.getAttribute("aria-pressed"),
			count: resultCount(),
			rows: tableSymbols(),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should drop one criterion when its filter chip is removed", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "3 of 5 companies";

		await user.click(
			screen.getByRole("button", { name: "Income at a fair price" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Remove Dividend yield filter" }),
		);
		const result = resultCount();

		expect(result).toBe(expectedResult);
	});

	it("should show the active-filter count on the Filters button when a strategy is applied", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "Filters2";

		await user.click(
			screen.getByRole("button", { name: "Income at a fair price" }),
		);
		const result = screen.getByRole("button", { name: /^Filters/ }).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should keep only the rows near their 52-week low when the signal is switched on", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = ["ALFA", "GAMMA", "OMEGA"];

		await user.click(screen.getByRole("switch", { name: "Near 52-week low" }));
		const result = tableSymbols();

		expect(result).toEqual(expectedResult);
	});

	it("should order the rows by descending P/E when the P/E header is clicked twice", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);
		const header = within(screen.getByRole("table")).getByRole("button", {
			name: "P/E",
		});

		const expectedResult = "DELTA";

		await user.click(header);
		await user.click(header);
		const result = tableSymbols()[0];

		expect(result).toBe(expectedResult);
	});

	it("should open the company preview when a result row is selected", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "Beta Industries";

		await user.click(
			within(screen.getByRole("table")).getByRole("button", {
				name: /^BETA/,
			}),
		);
		const result = (await screen.findByRole("dialog")).querySelector(
			"h2",
		)?.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should navigate to the company page when the preview link is followed", async () => {
		const user = userEvent.setup();
		render(
			<Routes>
				<Route
					path="/"
					element={
						<StockScreener
							stocks={fakeStockScreenerResults}
							hasCompanyPage={() => true}
						/>
					}
				/>
				<Route
					path="/companies/:symbol"
					element={<div>Company detail page</div>}
				/>
			</Routes>,
		);

		const expectedResult = true;

		await user.click(
			within(screen.getByRole("table")).getByRole("button", {
				name: /^BETA/,
			}),
		);
		await user.click(
			await screen.findByRole("link", { name: "Open company page" }),
		);
		const result = screen.queryByText("Company detail page") !== null;

		expect(result).toBe(expectedResult);
	});

	it("should keep the strategy pressed when a search is typed after it", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);
		const preset = screen.getByRole("button", {
			name: "Income at a fair price",
		});

		const expectedResult = "true";

		await user.click(preset);
		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"a",
		);
		const result = preset.getAttribute("aria-pressed");

		expect(result).toBe(expectedResult);
	});

	it("should keep the search when the active strategy is turned off", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);
		const preset = screen.getByRole("button", {
			name: "Income at a fair price",
		});

		const expectedResult = "Beta";

		await user.click(preset);
		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"Beta",
		);
		await user.click(preset);
		const result = (
			screen.getByRole("searchbox", {
				name: "Search by ticker or company",
			}) as HTMLInputElement
		).value;

		expect(result).toBe(expectedResult);
	});

	it("should not count the search on the Filters button when only a search is typed", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "Filters";

		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"Beta",
		);
		const result = screen.getByRole("button", { name: /^Filters/ }).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should apply a filter from the Filters sheet and close it when the reader asks for the results", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = { dialog: null, count: "3 of 5 companies" };

		await user.click(screen.getByRole("button", { name: /^Filters/ }));
		const sheet = within(
			await screen.findByRole("dialog", { name: "Filters" }),
		);
		await user.click(sheet.getByRole("switch", { name: "Near 52-week low" }));
		await user.click(sheet.getByRole("button", { name: "Show 3 companies" }));
		await waitFor(() => {
			if (screen.queryByRole("dialog")) throw new Error("still open");
		});
		const result = {
			dialog: screen.queryByRole("dialog"),
			count: resultCount(),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should name a header sort in the sort menu when the menu does not list it", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "Quick ratio, lowest first";

		await user.click(
			within(screen.getByRole("table")).getByRole("button", { name: "Quick" }),
		);
		// Deviation from TESTING.md §2.2: the trigger also holds the arrow icon,
		// so the value slot is read on its own.
		const result = screen
			.getByRole("combobox", { name: "Sort" })
			.querySelector('[data-slot="select-value"]')?.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should mark no card figure as sorted when the list has no sort", () => {
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = 0;

		const result = screen.queryAllByText(", sorted").length;

		expect(result).toBe(expectedResult);
	});

	it("should mark the sorted figure on every card when the list is sorted by it", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = fakeStockScreenerResults.length;

		await user.click(
			within(screen.getByRole("table")).getByRole("button", { name: "P/E" }),
		);
		const result = screen.queryAllByText(", sorted").length;

		expect(result).toBe(expectedResult);
	});
});
