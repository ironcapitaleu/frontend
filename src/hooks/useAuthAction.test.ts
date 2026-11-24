import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FailedAuthRequest, InvalidSignInCode } from "../lib/auth/errors";
import { FALLBACK_AUTH_ERROR, useAuthAction } from "./useAuthAction";

describe("useAuthAction", () => {
	it("should resolve true and hold no error when the action succeeds", async () => {
		const { result: hook } = renderHook(() => useAuthAction());

		const expectedResult = { succeeded: true, error: null };

		let succeeded = false;
		await act(async () => {
			succeeded = await hook.current.run(async () => ({ error: null }));
		});
		const result = { succeeded, error: hook.current.error };

		expect(result).toEqual(expectedResult);
	});

	it("should hold the vendor message when the action fails with a reason", async () => {
		const { result: hook } = renderHook(() => useAuthAction());

		const expectedResult = "Token has expired or is invalid";

		await act(async () => {
			await hook.current.run(async () => ({
				error: new InvalidSignInCode("Token has expired or is invalid"),
			}));
		});
		const result = hook.current.error;

		expect(result).toBe(expectedResult);
	});

	it("should hold the fallback message when the failure carries no reason", async () => {
		const { result: hook } = renderHook(() => useAuthAction());

		const expectedResult = FALLBACK_AUTH_ERROR;

		await act(async () => {
			await hook.current.run(async () => ({ error: new FailedAuthRequest() }));
		});
		const result = hook.current.error;

		expect(result).toBe(expectedResult);
	});

	it("should resolve false and hold the fallback message when the action throws", async () => {
		const { result: hook } = renderHook(() => useAuthAction());

		const expectedResult = { succeeded: false, error: FALLBACK_AUTH_ERROR };

		let succeeded = true;
		await act(async () => {
			succeeded = await hook.current.run(() =>
				Promise.reject(new Error("network down")),
			);
		});
		const result = { succeeded, error: hook.current.error };

		expect(result).toEqual(expectedResult);
	});
});
