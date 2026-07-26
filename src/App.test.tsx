import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock Supabase client
vi.mock("./lib/supabase", () => ({
	supabase: {
		auth: {
			getSession: vi
				.fn()
				.mockResolvedValue({ data: { session: null }, error: null }),
			onAuthStateChange: vi.fn().mockReturnValue({
				data: { subscription: { unsubscribe: vi.fn() } },
			}),
		},
	},
}));

describe("App", () => {
	it("should render the brand heading when the home page loads", async () => {
		await act(async () => {
			render(<App />);
		});

		const expectedResult = "Iron Capital";

		const result = screen.getByRole("heading", { name: /Iron Capital/i });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the product description when the home page loads", async () => {
		await act(async () => {
			render(<App />);
		});

		const expectedResult = "Research businesses.";

		const result = screen.getByText(/Research businesses/i);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the home navigation link when the home page loads", async () => {
		await act(async () => {
			render(<App />);
		});

		const expectedResult = "Iron Capital home";

		const result = screen.getByRole("link", { name: /Iron Capital home/i });

		expect(result).toHaveAccessibleName(expectedResult);
	});
});
