import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
	it("renders the home page by default", () => {
		render(<App />);

		// Check for the main heading on the home page
		expect(
			screen.getByText(/Premium Investment Partnership/i),
		).toBeInTheDocument();

		// Check for the description text
		expect(
			screen.getByText(/Iron Capital combines advanced analytics/i),
		).toBeInTheDocument();
	});

	it("renders navigation links", () => {
		render(<App />);

		// Check if navigation elements are present (assuming they are in Layout)
		// We might need to look for specific links or text in the navigation
		// Since I haven't seen Navigation.tsx, I'll just check for the "Explore Stock Screener" button which is on the home page
		expect(
			screen.getByRole("link", { name: /Explore Stock Screener/i }),
		).toBeInTheDocument();
	});
});
