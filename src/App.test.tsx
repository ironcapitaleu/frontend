import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock Supabase client
vi.mock("./lib/supabase", () => ({
	supabase: {
		auth: {
			getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
			onAuthStateChange: vi.fn().mockReturnValue({
				data: { subscription: { unsubscribe: vi.fn() } },
			}),
		},
	},
}));

describe("App", () => {
	it("renders the home page by default", async () => {
		await act(async () => {
			render(<App />);
		});

		// Check for the main heading on the home page
		expect(
			screen.getByText(/Premium Investment Partnership/i),
		).toBeInTheDocument();

		// Check for the description text
		expect(
			screen.getByText(/Iron Capital combines advanced analytics/i),
		).toBeInTheDocument();
	});

	it("renders navigation links", async () => {
		await act(async () => {
			render(<App />);
		});

		// Check if navigation elements are present
		expect(
			screen.getByRole("link", { name: /Explore Stock Screener/i }),
		).toBeInTheDocument();
	});
});
