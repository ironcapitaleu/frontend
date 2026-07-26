import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { alwaysAuthenticatedAuth } from "../test/fixtures/auth/always-authenticated";
import { alwaysUnauthenticatedAuth } from "../test/fixtures/auth/always-unauthenticated";
import { fakeUser } from "../test/fixtures/auth/user";
import { useAuth } from "./useAuth";

describe("useAuth", () => {
	it("should expose no user when the gateway is unauthenticated", async () => {
		const { result: hook } = renderHook(() =>
			useAuth(alwaysUnauthenticatedAuth()),
		);

		const expectedResult = { user: null, loading: false };

		await waitFor(() => {
			if (hook.current.loading) throw new Error("still loading");
		});
		const result = { user: hook.current.user, loading: hook.current.loading };

		expect(result).toEqual(expectedResult);
	});

	it("should expose the signed-in user when the gateway is authenticated", async () => {
		const { result: hook } = renderHook(() =>
			useAuth(alwaysAuthenticatedAuth()),
		);

		const expectedResult = fakeUser;

		await waitFor(() => {
			if (hook.current.loading) throw new Error("still loading");
		});
		const result = hook.current.user;

		expect(result).toEqual(expectedResult);
	});
});
