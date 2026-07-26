import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import NotFoundPage from "./NotFoundPage";

describe("NotFoundPage", () => {
	it("should render the 404 status indicator", () => {
		render(<NotFoundPage />);

		const expectedResult = "404";

		const result = screen.getByText("404");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should offer a link back to the homepage", () => {
		render(<NotFoundPage />);

		const expectedResult = "/";

		const result = screen.getByRole("link", { name: /Return to homepage/i });

		expect(result).toHaveAttribute("href", expectedResult);
	});
});
