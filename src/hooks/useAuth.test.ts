import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvalidCredentials } from "../lib/auth/errors";
import type { AuthGateway, AuthUser } from "../lib/auth/gateway";
import { alwaysAuthenticatedAuth } from "../test/fixtures/auth/always-authenticated";
import { alwaysUnauthenticatedAuth } from "../test/fixtures/auth/always-unauthenticated";
import { fakeUser } from "../test/fixtures/auth/user";
import { useAuth } from "./useAuth";

describe("useAuth", () => {
	it("should expose no user when the gateway is unauthenticated", async () => {
		const gateway = alwaysUnauthenticatedAuth();
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = { user: null, loading: false };

		await waitFor(() => {
			if (hook.current.loading) throw new Error("still loading");
		});
		const result = { user: hook.current.user, loading: hook.current.loading };

		expect(result).toEqual(expectedResult);
	});

	it("should expose the signed-in user when the gateway is authenticated", async () => {
		const gateway = alwaysAuthenticatedAuth();
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = fakeUser;

		await waitFor(() => {
			if (hook.current.loading) throw new Error("still loading");
		});
		const result = hook.current.user;

		expect(result).toEqual(expectedResult);
	});

	it("should stop loading when the gateway fails to resolve the current user", async () => {
		const gateway: AuthGateway = {
			...alwaysUnauthenticatedAuth(),
			getCurrentUser: () => Promise.reject(new Error("gateway unreachable")),
		};
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = { user: null, loading: false };

		await waitFor(() => {
			if (hook.current.loading) throw new Error("still loading");
		});
		const result = { user: hook.current.user, loading: hook.current.loading };

		expect(result).toEqual(expectedResult);
	});

	it("should expose the user when the gateway emits a sign-in", async () => {
		let emit: (nextUser: AuthUser | null) => void = () => {};
		const gateway: AuthGateway = {
			...alwaysUnauthenticatedAuth(),
			onUserChange: (listener) => {
				emit = listener;
				return () => {};
			},
		};
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = fakeUser;

		await waitFor(() => {
			if (hook.current.loading) throw new Error("still loading");
		});
		act(() => {
			emit(fakeUser);
		});
		const result = hook.current.user;

		expect(result).toEqual(expectedResult);
	});

	it("should clear the user when the gateway emits a sign-out", async () => {
		let emit: (nextUser: AuthUser | null) => void = () => {};
		const gateway: AuthGateway = {
			...alwaysAuthenticatedAuth(),
			onUserChange: (listener) => {
				emit = listener;
				return () => {};
			},
		};
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = null;

		await waitFor(() => {
			if (hook.current.user === null) throw new Error("not signed in yet");
		});
		act(() => {
			emit(null);
		});
		const result = hook.current.user;

		expect(result).toEqual(expectedResult);
	});

	it("should return the gateway's failure when signing in with rejected credentials", async () => {
		const gateway = alwaysUnauthenticatedAuth();
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedError = InvalidCredentials;

		const outcome = await hook.current.signInWithEmail(
			"investor@ironcapital.test",
			"wrong-password",
		);
		const result = outcome.error;

		expect(result).toBeInstanceOf(expectedError);
	});

	it("should report success when signing up through the gateway", async () => {
		const gateway = alwaysAuthenticatedAuth();
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = { error: null };

		const result = await hook.current.signUpWithEmail(
			"investor@ironcapital.test",
			"a-strong-password",
		);

		expect(result).toEqual(expectedResult);
	});

	it("should report success when signing out through the gateway", async () => {
		const gateway = alwaysUnauthenticatedAuth();
		const { result: hook } = renderHook(() => useAuth(gateway));

		const expectedResult = { error: null };

		const result = await hook.current.signOut();

		expect(result).toEqual(expectedResult);
	});
});
