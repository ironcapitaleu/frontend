import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import NavBar from "./NavBar";

describe("NavBar", () => {
	it("should link the brand mark to the home route", () => {
		render(<NavBar />);

		const expectedResult = "/";

		const result = screen.getByRole("link", { name: "Iron Capital home" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should link the Screener item to the screener route", () => {
		render(<NavBar />);

		const expectedResult = "/screener";

		const result = screen.getByRole("link", { name: "Screener" });

		expect(result).toHaveAttribute("href", expectedResult);
	});
});
