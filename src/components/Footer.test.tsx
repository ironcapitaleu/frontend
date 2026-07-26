import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import Footer from "./Footer";

describe("Footer", () => {
	it("should display the current year in the copyright notice", () => {
		render(<Footer />);

		const expectedResult = `© ${new Date().getFullYear()} Iron Capital. All rights reserved.`;

		const result = screen.getByText(/All rights reserved/i);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should link to the privacy policy", () => {
		render(<Footer />);

		const expectedResult = "/privacy";

		const result = screen.getByRole("link", { name: "Privacy Policy" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should link to the sitemap", () => {
		render(<Footer />);

		const expectedResult = "/sitemap";

		const result = screen.getByRole("link", { name: "Sitemap" });

		expect(result).toHaveAttribute("href", expectedResult);
	});
});
