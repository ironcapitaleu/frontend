import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "../test/fixtures/stocks/fake-stock-screener-results";
import { render, screen, within } from "../test/render";
import StockScreener from "./StockScreener";

/** The toolbar count, read from the "N result(s)" summary the user sees. */
function resultCount(): string {
	return screen.getByText(/^\d+ results?$/).textContent ?? "";
}

/** Which fixture symbols are currently rendered as rows, keyed by symbol. */
function symbolPresence(): Record<string, boolean> {
	return Object.fromEntries(
		fakeStockScreenerResults.map((stock) => [
			stock.symbol,
			screen.queryByText(stock.symbol) !== null,
		]),
	);
}

describe("StockScreener", () => {
	it("should list every injected stock as a result when no filter is applied", () => {
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = `${fakeStockScreenerResults.length} results`;

		const result = resultCount();

		expect(result).toBe(expectedResult);
	});

	it("should show only the rows matching the search term when a search is typed", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		// "Beta" matches the symbol/name of exactly one fixture row.
		const expectedResult = {
			ALFA: false,
			BETA: true,
			GAMMA: false,
			DELTA: false,
			OMEGA: false,
		};

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.type(screen.getByPlaceholderText(/symbol or name/i), "Beta");
		const result = symbolPresence();

		expect(result).toEqual(expectedResult);
	});

	it("should show the empty-state message when no row matches the search", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = true;

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.type(screen.getByPlaceholderText(/symbol or name/i), "ZZZZ");
		const result =
			screen.getByText(/no results match the current filters/i) !== null;

		expect(result).toBe(expectedResult);
	});

	it("should show the active-filter count on the Filters button when one filter is applied", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "1";

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.type(screen.getByPlaceholderText(/symbol or name/i), "Beta");
		const result = within(
			screen.getByRole("button", { name: /filters/i }),
		).getByText("1").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should reveal the Reset control when a filter is applied", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = true;

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.type(screen.getByPlaceholderText(/symbol or name/i), "Beta");
		const result = screen.getByRole("button", { name: /reset/i }) !== null;

		expect(result).toBe(expectedResult);
	});

	it("should restore every result row when the filters are reset", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = `${fakeStockScreenerResults.length} results`;

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.type(screen.getByPlaceholderText(/symbol or name/i), "Beta");
		await user.click(screen.getByRole("button", { name: /reset/i }));
		const result = resultCount();

		expect(result).toBe(expectedResult);
	});

	it("should expand the filter panel when the Filters button is clicked", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = "true";

		await user.click(screen.getByRole("button", { name: /filters/i }));
		const result = screen
			.getByRole("button", { name: /filters/i })
			.getAttribute("aria-expanded");

		expect(result).toBe(expectedResult);
	});

	it("should keep only the rows trading near their 52-week low when the technical filter is checked", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		// Alfa, Gamma and Omega trade within the near-low band; Beta and Delta do not.
		const expectedResult = {
			ALFA: true,
			BETA: false,
			GAMMA: true,
			DELTA: false,
			OMEGA: true,
		};

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.click(screen.getByRole("checkbox", { name: /near 52-wk low/i }));
		const result = symbolPresence();

		expect(result).toEqual(expectedResult);
	});

	it("should tag a row trading near its 52-week low with a Near Low badge", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		const expectedResult = true;

		await user.click(screen.getByRole("button", { name: /filters/i }));
		await user.type(screen.getByPlaceholderText(/symbol or name/i), "Omega");
		const result = screen.getByText("Near Low") !== null;

		expect(result).toBe(expectedResult);
	});

	it("should order the rows by descending symbol when the Symbol header is clicked twice", async () => {
		const user = userEvent.setup();
		render(<StockScreener stocks={fakeStockScreenerResults} />);

		// Omega is the alphabetically-last fixture symbol, so it leads a descending sort.
		const expectedResult = "OMEGA";

		await user.click(screen.getByText("Symbol"));
		await user.click(screen.getByText("Symbol"));
		const firstDataRow = screen.getAllByRole("row")[1];
		const result = within(firstDataRow).getAllByRole("cell")[0].textContent;

		expect(result).toContain(expectedResult);
	});

	it("should navigate to the company page when a result row is clicked", async () => {
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

		await user.click(screen.getByText("Beta Industries"));
		const result = screen.getByText(/company detail page/i) !== null;

		expect(result).toBe(expectedResult);
	});
});
