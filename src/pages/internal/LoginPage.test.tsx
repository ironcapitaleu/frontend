import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { AuthGateway, AuthUser } from "../../lib/auth/gateway";
import { alwaysAuthenticatedAuth } from "../../test/fixtures/auth/always-authenticated";
import { alwaysFailingAuth } from "../../test/fixtures/auth/always-failing";
import { alwaysUnauthenticatedAuth } from "../../test/fixtures/auth/always-unauthenticated";
import { fakeUser } from "../../test/fixtures/auth/user";
import { render, screen } from "../../test/render";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
	it("should offer a continue button for each provider and for email when the visitor is signed out", () => {
		render(<LoginPage />);

		const expectedResult = [
			"Continue with Google",
			"Continue with GitHub",
			"Continue with email",
		];

		const result = screen
			.getAllByRole("button", { name: /^Continue with/ })
			.map((button) => button.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should show the consent line with a link to the privacy policy when the visitor is signed out", () => {
		render(<LoginPage />);

		const expectedResult = "/privacy";

		const result = screen.getByRole("link", { name: "privacy policy" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should show the check-your-email step with the address when the sign-in mail is sent", async () => {
		render(<LoginPage />);
		const user = userEvent.setup();

		const expectedResult =
			"We sent a 6-digit code and a sign-in link to you@example.com. Enter the code, or open the link on this device.";

		await user.type(screen.getByLabelText("Email"), "You@Example.com");
		await user.click(
			screen.getByRole("button", { name: "Continue with email" }),
		);
		await screen.findByRole("heading", { name: "Check your email" });
		const result = screen.getByText(/We sent a 6-digit code/);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should ask for a valid address and stay on the email step when the email is malformed", async () => {
		render(<LoginPage />);
		const user = userEvent.setup();

		const expectedResult = {
			alert: "Enter a valid email address.",
			heading: "Sign in or create an account",
		};

		await user.type(screen.getByLabelText("Email"), "not-an-email");
		await user.click(
			screen.getByRole("button", { name: "Continue with email" }),
		);
		const result = {
			alert: screen.getByRole("alert").textContent,
			heading: screen.getByRole("heading", { level: 1 }).textContent,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show the error of the auth service when sending the sign-in mail fails", async () => {
		render(<LoginPage />, { gateway: alwaysFailingAuth() });
		const user = userEvent.setup();

		const expectedResult = "Auth service unavailable";

		await user.type(screen.getByLabelText("Email"), "you@example.com");
		await user.click(
			screen.getByRole("button", { name: "Continue with email" }),
		);
		const result = await screen.findByRole("alert");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should show the error of the auth service when the provider sign-in fails", async () => {
		render(<LoginPage />, { gateway: alwaysFailingAuth() });
		const user = userEvent.setup();

		const expectedResult = "Auth service unavailable";

		await user.click(
			screen.getByRole("button", { name: "Continue with GitHub" }),
		);
		const result = await screen.findByRole("alert");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should show the Supabase error when the code is wrong or expired", async () => {
		render(<LoginPage />);
		const user = userEvent.setup();

		const expectedResult = "Token has expired or is invalid";

		await user.type(screen.getByLabelText("Email"), "you@example.com");
		await user.click(
			screen.getByRole("button", { name: "Continue with email" }),
		);
		await user.type(await screen.findByLabelText("Code"), "000000");
		await user.click(screen.getByRole("button", { name: "Sign in" }));
		const result = await screen.findByRole("alert");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should show the signed-in step when the code is accepted", async () => {
		let emit: (nextUser: AuthUser | null) => void = () => {};
		const gateway: AuthGateway = {
			...alwaysUnauthenticatedAuth(),
			onUserChange: (listener) => {
				emit = listener;
				return () => {};
			},
			verifySignInCode: async () => {
				emit(fakeUser);
				return { error: null };
			},
		};
		render(<LoginPage />, { gateway });
		const user = userEvent.setup();

		const expectedResult = "You are signed in";

		await user.type(screen.getByLabelText("Email"), "you@example.com");
		await user.click(
			screen.getByRole("button", { name: "Continue with email" }),
		);
		await user.type(await screen.findByLabelText("Code"), "123456");
		await user.click(screen.getByRole("button", { name: "Sign in" }));
		const result = await screen.findByRole("heading", {
			name: "You are signed in",
		});

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should return to the email step when the visitor chooses a different email", async () => {
		render(<LoginPage />);
		const user = userEvent.setup();

		const expectedResult = "Sign in or create an account";

		await user.type(screen.getByLabelText("Email"), "you@example.com");
		await user.click(
			screen.getByRole("button", { name: "Continue with email" }),
		);
		await user.click(
			await screen.findByRole("button", { name: "Use a different email" }),
		);
		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should show the email of the account and a sign-out button when the visitor is signed in", async () => {
		render(<LoginPage />, { gateway: alwaysAuthenticatedAuth() });

		const expectedResult = {
			email: `Signed in as ${fakeUser.email}.`,
			signOut: "Sign out",
		};

		const result = {
			email: (await screen.findByText(/Signed in as/)).textContent,
			signOut: screen.getByRole("button", { name: "Sign out" }).textContent,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show the error of the auth service when the sign-out fails", async () => {
		const gateway: AuthGateway = {
			...alwaysFailingAuth(),
			getCurrentUser: async () => fakeUser,
		};
		render(<LoginPage />, { gateway });
		const user = userEvent.setup();

		const expectedResult = "Auth service unavailable";

		await user.click(await screen.findByRole("button", { name: "Sign out" }));
		const result = await screen.findByRole("alert");

		expect(result).toHaveTextContent(expectedResult);
	});
});
