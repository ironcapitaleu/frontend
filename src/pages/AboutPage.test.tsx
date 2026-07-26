import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import AboutPage from "./AboutPage";

describe("AboutPage", () => {
	it("should render the opening statement", () => {
		render(<AboutPage />);

		const expectedResult =
			"Every successful investment begins with a deep understanding of the business.";

		const result = screen.getByText(/Every successful investment begins/i);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the Timeless Principles heading", () => {
		render(<AboutPage />);

		const expectedResult = "Timeless Principles";

		const result = screen.getByRole("heading", { name: "Timeless Principles" });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the Our Method heading", () => {
		render(<AboutPage />);

		const expectedResult = "Our Method";

		const result = screen.getByRole("heading", { name: "Our Method" });

		expect(result).toHaveTextContent(expectedResult);
	});
});
