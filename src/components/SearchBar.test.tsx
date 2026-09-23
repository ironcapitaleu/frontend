import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

	it("should report each keystroke and show the given value when the page controls it", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<SearchBar
				aria-label="Search by ticker or company"
				value="AB"
				onChange={onChange}
			/>,
		);

		const expectedResult = { value: "AB", calls: 1 };

		await user.type(
			screen.getByRole("searchbox", { name: "Search by ticker or company" }),
			"C",
		);
		const result = {
			value: (screen.getByRole("searchbox") as HTMLInputElement).value,
			calls: onChange.mock.calls.length,
		};

		expect(result).toEqual(expectedResult);
	});
});
