import { AuthError, type Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Email } from "../domain/email";
import { FailedAuthRequest, InvalidSignInCode } from "./errors";
import type { AuthUser } from "./gateway";
import { supabaseAuthGateway } from "./supabaseAuthGateway";

// The adapter is the one place the vendor is named, so its test mocks the vendor
// module directly (the interim seam TESTING.md allows for vendor-coupled code)
// and asserts the port output the adapter maps the vendor result onto.
const auth = vi.hoisted(() => ({
	getUser: vi.fn(),
	onAuthStateChange: vi.fn(),
	signInWithOAuth: vi.fn(),
	signInWithOtp: vi.fn(),
	signOut: vi.fn(),
	verifyOtp: vi.fn(),
}));

vi.mock("../supabase", () => ({ supabase: { auth } }));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("supabaseAuthGateway", () => {
	describe("getCurrentUser", () => {
		it("should return the mapped user when the auth server confirms a signed-in user", async () => {
			auth.getUser.mockResolvedValue({
				data: { user: { id: "user-1", email: "investor@ironcapital.test" } },
			});

			const expectedResult = {
				id: "user-1",
				email: "investor@ironcapital.test",
			};

			const result = await supabaseAuthGateway().getCurrentUser();

			expect(result).toEqual(expectedResult);
		});

		it("should return null when the auth server reports no signed-in user", async () => {
			auth.getUser.mockResolvedValue({ data: { user: null } });

			const expectedResult = null;

			const result = await supabaseAuthGateway().getCurrentUser();

			expect(result).toBe(expectedResult);
		});
	});

	describe("sendSignInCode", () => {
		it("should ask the vendor to create the user when sending the sign-in code", async () => {
			auth.signInWithOtp.mockResolvedValue({ error: null });
			const email = Email.parse("you@example.com");

			const expectedArgs = {
				email: "you@example.com",
				options: { shouldCreateUser: true },
			};

			await supabaseAuthGateway().sendSignInCode(email);

			expect(auth.signInWithOtp).toHaveBeenCalledWith(expectedArgs);
		});

		it("should map the vendor error to FailedAuthRequest when the vendor rejects the request", async () => {
			auth.signInWithOtp.mockResolvedValue({
				error: new AuthError(
					"For security purposes, you can only request this after 59 seconds.",
					429,
					"over_email_send_rate_limit",
				),
			});
			const email = Email.parse("you@example.com");

			const result = (await supabaseAuthGateway().sendSignInCode(email)).error;

			expect(result).toBeInstanceOf(FailedAuthRequest);
		});
	});

	describe("verifySignInCode", () => {
		it("should forward the email and the code with the email type when verifying a code", async () => {
			auth.verifyOtp.mockResolvedValue({ error: null });
			const email = Email.parse("you@example.com");

			const expectedArgs = {
				email: "you@example.com",
				token: "123456",
				type: "email",
			};

			await supabaseAuthGateway().verifySignInCode(email, "123456");

			expect(auth.verifyOtp).toHaveBeenCalledWith(expectedArgs);
		});

		it("should map the vendor error to InvalidSignInCode when the code is rejected", async () => {
			auth.verifyOtp.mockResolvedValue({
				error: new AuthError(
					"Token has expired or is invalid",
					403,
					"otp_expired",
				),
			});
			const email = Email.parse("you@example.com");

			const result = (
				await supabaseAuthGateway().verifySignInCode(email, "000000")
			).error;

			expect(result).toBeInstanceOf(InvalidSignInCode);
		});
	});

	describe("verifySignInLink", () => {
		it("should forward the token hash with the email type when verifying a link", async () => {
			auth.verifyOtp.mockResolvedValue({ error: null });

			const expectedArgs = { token_hash: "abc123", type: "email" };

			await supabaseAuthGateway().verifySignInLink("abc123");

			expect(auth.verifyOtp).toHaveBeenCalledWith(expectedArgs);
		});

		it("should resolve a null error when the link is accepted", async () => {
			auth.verifyOtp.mockResolvedValue({ error: null });

			const expectedResult = null;

			const result = (await supabaseAuthGateway().verifySignInLink("abc123"))
				.error;

			expect(result).toBe(expectedResult);
		});
	});

	describe("signInWithProvider", () => {
		it("should forward the provider and the return URL when signing in with a provider", async () => {
			auth.signInWithOAuth.mockResolvedValue({ error: null });

			const expectedArgs = {
				provider: "github",
				options: { redirectTo: "http://127.0.0.1:3000/login" },
			};

			await supabaseAuthGateway().signInWithProvider(
				"github",
				"http://127.0.0.1:3000/login",
			);

			expect(auth.signInWithOAuth).toHaveBeenCalledWith(expectedArgs);
		});
	});

	describe("signOut", () => {
		it("should resolve a null error when sign-out succeeds", async () => {
			auth.signOut.mockResolvedValue({ error: null });

			const expectedResult = null;

			const result = (await supabaseAuthGateway().signOut()).error;

			expect(result).toBe(expectedResult);
		});

		it("should map the vendor error to FailedAuthRequest when sign-out is rejected", async () => {
			auth.signOut.mockResolvedValue({
				error: new AuthError("Service down", 503, "over_request_rate_limit"),
			});

			const result = (await supabaseAuthGateway().signOut()).error;

			expect(result).toBeInstanceOf(FailedAuthRequest);
		});
	});

	describe("onUserChange", () => {
		it("should pass the mapped user to the listener when the vendor emits a session with a user", () => {
			let vendorCallback: (event: string, session: Session | null) => void =
				() => {};
			auth.onAuthStateChange.mockImplementation((callback) => {
				vendorCallback = callback;
				return { data: { subscription: { unsubscribe: vi.fn() } } };
			});
			const received: (AuthUser | null)[] = [];
			supabaseAuthGateway().onUserChange((user) => received.push(user));

			const expectedResult = {
				id: "user-1",
				email: "investor@ironcapital.test",
			};

			vendorCallback("SIGNED_IN", {
				user: { id: "user-1", email: "investor@ironcapital.test" },
			} as unknown as Session);
			const result = received[0];

			expect(result).toEqual(expectedResult);
		});

		it("should pass null to the listener when the vendor emits a null session", () => {
			let vendorCallback: (event: string, session: Session | null) => void =
				() => {};
			auth.onAuthStateChange.mockImplementation((callback) => {
				vendorCallback = callback;
				return { data: { subscription: { unsubscribe: vi.fn() } } };
			});
			const received: (AuthUser | null)[] = [];
			supabaseAuthGateway().onUserChange((user) => received.push(user));

			const expectedResult = null;

			vendorCallback("SIGNED_OUT", null);
			const result = received[0];

			expect(result).toBe(expectedResult);
		});

		it("should unsubscribe from the vendor subscription when the teardown runs", () => {
			const unsubscribe = vi.fn();
			auth.onAuthStateChange.mockReturnValue({
				data: { subscription: { unsubscribe } },
			});
			const teardown = supabaseAuthGateway().onUserChange(() => {});

			const expectedResult = 1;

			teardown();
			const result = unsubscribe.mock.calls.length;

			expect(result).toBe(expectedResult);
		});
	});
});
