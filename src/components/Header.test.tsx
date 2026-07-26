import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { render, screen, within } from "../test/render";
import Header from "./Header";

describe("Header", () => {
	it("should link the brand mark to the home route", () => {
		render(<Header />);

		const expectedResult = "/";

		const result = screen.getByRole("link", { name: "Iron Capital home" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should point the About item to the about route within the main navigation", () => {
		render(<Header />);

		const expectedResult = "/about";

		const mainNav = screen.getByRole("navigation", { name: "Main navigation" });
		const result = within(mainNav).getByRole("link", { name: "About" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should label the hamburger control 'Open menu' when the mobile menu is closed", () => {
		render(<Header />);

		const expectedResult = "Open menu";

		const result = screen.getByRole("button", { name: "Open menu" });

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should relabel the hamburger control 'Close menu' when it is opened", async () => {
		render(<Header />);
		const user = userEvent.setup();

		const expectedResult = "Close menu";

		await user.click(screen.getByRole("button", { name: "Open menu" }));
		const result = screen.getByRole("button", { name: "Close menu" });

		expect(result).toHaveAccessibleName(expectedResult);
	});
});
