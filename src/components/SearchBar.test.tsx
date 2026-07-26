import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
	it("should expose the search field by its accessible label", () => {
		render(<SearchBar />);

		const expectedResult = "Search";

		const result = screen.getByRole("searchbox");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should prompt for companies, tickers and funds via the placeholder", () => {
		render(<SearchBar />);

		const expectedResult = "Search companies, tickers, funds…";

		const result = screen.getByRole("searchbox");

		expect(result).toHaveAttribute("placeholder", expectedResult);
	});
});
