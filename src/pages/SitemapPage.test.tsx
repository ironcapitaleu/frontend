import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import SitemapPage from "./SitemapPage";

describe("SitemapPage", () => {
	it("should render the Sitemap title", () => {
		render(<SitemapPage />);

		const expectedResult = "Sitemap";

		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should link About to the about route", () => {
		render(<SitemapPage />);

		const expectedResult = "/about";

		const result = screen.getByRole("link", { name: "About" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should group the site's routes under the Iron Capital heading", () => {
		render(<SitemapPage />);

		const expectedResult = "Iron Capital";

		const result = screen.getByRole("heading", { name: "Iron Capital" });

		expect(result).toHaveTextContent(expectedResult);
	});
});
