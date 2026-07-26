import { describe, expect, it } from "vitest";

import { render, screen } from "./test/render";
import App from "./App";

describe("App", () => {
	it("should render the brand heading when the home page loads", async () => {
		render(<App />);

		const expectedResult = "Iron Capital";

		const result = await screen.findByRole("heading", {
			name: /Iron Capital/i,
		});

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the product description when the home page loads", async () => {
		render(<App />);

		const expectedResult = "Research businesses.";

		const result = await screen.findByText(/Research businesses/i);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the home navigation link when the home page loads", async () => {
		render(<App />);

		const expectedResult = "Iron Capital home";

		const result = await screen.findByRole("link", {
			name: /Iron Capital home/i,
		});

		expect(result).toHaveAccessibleName(expectedResult);
	});
});
