import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { alwaysAuthenticatedAuth } from "../../test/fixtures/auth/always-authenticated";
import { render, screen } from "../../test/render";
import AuthConfirmPage from "./AuthConfirmPage";

const LINK = "/auth/confirm?token_hash=abc123&type=email";

describe("AuthConfirmPage", () => {
	it("should show no error when the visitor has not clicked the button", () => {
		render(<AuthConfirmPage />, { initialEntries: [LINK] });

		const expectedResult = null;

		const result = screen.queryByRole("alert");

		expect(result).toBe(expectedResult);
	});

	it("should show the Supabase error when the link is wrong or expired", async () => {
		render(<AuthConfirmPage />, { initialEntries: [LINK] });
		const user = userEvent.setup();

		const expectedResult = "Email link is invalid or has expired";

		await user.click(screen.getByRole("button", { name: "Sign in" }));
		const result = await screen.findByRole("alert");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should go to the sign-in page when the link is accepted", async () => {
		render(
			<Routes>
				<Route path="/auth/confirm" element={<AuthConfirmPage />} />
				<Route path="/login" element={<p>Login destination</p>} />
			</Routes>,
			{ gateway: alwaysAuthenticatedAuth(), initialEntries: [LINK] },
		);
		const user = userEvent.setup();

		const expectedResult = "Login destination";

		await user.click(screen.getByRole("button", { name: "Sign in" }));
		const result = await screen.findByText("Login destination");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should disable the button when the link has no token hash", () => {
		render(<AuthConfirmPage />, { initialEntries: ["/auth/confirm"] });

		const expectedResult = true;

		const result = screen
			.getByRole("button", { name: "Sign in" })
			.hasAttribute("disabled");

		expect(result).toBe(expectedResult);
	});
});
