import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "../../test/fixtures/stocks/fake-stock-screener-results";
import { render, screen, within } from "../../test/render";
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

	it("should show the empty-state message when no row matches the search", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = true;

		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"ZZZZ",
		);
		const result =
			screen.queryAllByText("No companies match these filters.").length > 0;

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
					element={<StockScreener stocks={fakeStockScreenerResults} />}
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
});
