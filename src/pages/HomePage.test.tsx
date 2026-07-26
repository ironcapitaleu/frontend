import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import HomePage from "./HomePage";

describe("HomePage", () => {
	it("should render the brand heading", () => {
		render(<HomePage />);

		const expectedResult = "Iron Capital";

		const result = screen.getByRole("heading", { name: "Iron Capital" });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the product tagline", () => {
		render(<HomePage />);

		const expectedResult = "Research businesses.";

		const result = screen.getByText("Research businesses.");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the search field", () => {
		render(<HomePage />);

		const expectedResult = "Search";

		const result = screen.getByRole("searchbox");

		expect(result).toHaveAccessibleName(expectedResult);
	});
});
