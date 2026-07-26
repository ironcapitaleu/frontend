import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { alwaysAuthenticatedAuth } from "../test/fixtures/auth/always-authenticated";
import { render, screen } from "../test/render";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
	it("should show the sign-in heading by default", () => {
		render(<LoginPage />);

		const expectedResult = "Sign in to your account";

		const result = screen.getByRole("heading", {
			name: "Sign in to your account",
		});

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should offer the passkey continue button", () => {
		render(<LoginPage />);

		const expectedResult = "Continue with passkey";

		const result = screen.getByRole("button", {
			name: /Continue with passkey/i,
		});

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should switch to the create-account heading when the create-account toggle is clicked", async () => {
		render(<LoginPage />);
		const user = userEvent.setup();

		const expectedResult = "Create an account";

		await user.click(screen.getByRole("button", { name: "Create an account" }));
		const result = await screen.findByRole("heading", {
			name: "Create an account",
		});

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should redirect to the home page when an authenticated visitor opens the login page", async () => {
		render(
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/" element={<p>Home destination</p>} />
			</Routes>,
			{ gateway: alwaysAuthenticatedAuth(), initialEntries: ["/login"] },
		);

		const expectedResult = "Home destination";

		const result = await screen.findByText("Home destination");

		expect(result).toHaveTextContent(expectedResult);
	});
});
