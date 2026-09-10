import { AuthError, type Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FailedAuthRequest, InvalidCredentials } from "./errors";
import type { AuthUser } from "./gateway";
import { supabaseAuthGateway } from "./supabaseAuthGateway";

// The adapter is the one place the vendor is named, so its test mocks the vendor
// module directly (the interim seam TESTING.md allows for vendor-coupled code)
// and asserts the port output the adapter maps the vendor result onto.
const auth = vi.hoisted(() => ({
	getUser: vi.fn(),
	onAuthStateChange: vi.fn(),
	signInWithPassword: vi.fn(),
	signUp: vi.fn(),
	signOut: vi.fn(),
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

	describe("signInWithEmail", () => {
		it("should resolve a null error when sign-in succeeds", async () => {
			auth.signInWithPassword.mockResolvedValue({ error: null });

			const expectedResult = null;

			const result = (
				await supabaseAuthGateway().signInWithEmail("a@b.test", "pw")
			).error;

			expect(result).toBe(expectedResult);
		});

		it("should map the vendor error to InvalidCredentials when sign-in is rejected", async () => {
			auth.signInWithPassword.mockResolvedValue({
				error: new AuthError(
					"Invalid login credentials",
					400,
					"invalid_credentials",
				),
			});

			const result = (
				await supabaseAuthGateway().signInWithEmail("a@b.test", "pw")
			).error;

			expect(result).toBeInstanceOf(InvalidCredentials);
		});
	});

	describe("signUpWithEmail", () => {
		it("should resolve a null error when sign-up succeeds", async () => {
			auth.signUp.mockResolvedValue({ error: null });

			const expectedResult = null;

			const result = (
				await supabaseAuthGateway().signUpWithEmail("a@b.test", "pw")
			).error;

			expect(result).toBe(expectedResult);
		});

		it("should map the vendor error to FailedAuthRequest when sign-up is rejected", async () => {
			auth.signUp.mockResolvedValue({
				error: new AuthError("Service down", 503, "over_request_rate_limit"),
			});

			const result = (
				await supabaseAuthGateway().signUpWithEmail("a@b.test", "pw")
			).error;

			expect(result).toBeInstanceOf(FailedAuthRequest);
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
		it("should pass the mapped user to the listener when the vendor reports a sign-in", () => {
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

		it("should pass null to the listener when the vendor reports a sign-out", () => {
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
