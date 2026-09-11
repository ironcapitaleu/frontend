import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY } from "../lib/theme/theme";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.classList.remove("dark");
	});

	afterEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
		document.documentElement.classList.remove("dark");
	});

	it("should default the choice to 'system' when nothing is stored", () => {
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "system";

		const result = hook.current.choice;

		expect(result).toBe(expectedResult);
	});

	it("should read the persisted choice back on load", () => {
		window.localStorage.setItem(THEME_STORAGE_KEY, "light");
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "light";

		const result = hook.current.choice;

		expect(result).toBe(expectedResult);
	});

	it("should persist the choice when it is changed", () => {
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "dark";

		act(() => {
			hook.current.setChoice("dark");
		});
		const result = window.localStorage.getItem(THEME_STORAGE_KEY);

		expect(result).toBe(expectedResult);
	});

	it("should apply the 'dark' class to the document root when dark is chosen", () => {
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = true;

		act(() => {
			hook.current.setChoice("dark");
		});
		const result = document.documentElement.classList.contains("dark");

		expect(result).toBe(expectedResult);
	});

	it("should resolve 'system' to light when the OS does not prefer dark", () => {
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "light";

		const result = hook.current.resolvedTheme;

		expect(result).toBe(expectedResult);
	});

	it("should default the choice to 'system' when reading storage throws", () => {
		vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
			throw new Error("storage blocked");
		});
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "system";

		const result = hook.current.choice;

		expect(result).toBe(expectedResult);
	});

	it("should still apply the choice when writing storage throws", () => {
		vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
			throw new Error("storage blocked");
		});
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "dark";

		act(() => {
			hook.current.setChoice("dark");
		});
		const result = hook.current.choice;

		expect(result).toBe(expectedResult);
	});

	it("should re-resolve to dark when the OS preference changes to dark on the system choice", () => {
		const changeListeners = stubMatchMedia();
		const { result: hook } = renderHook(() => useTheme());

		const expectedResult = "dark";

		act(() => {
			for (const notify of changeListeners) {
				notify({ matches: true } as MediaQueryListEvent);
			}
		});
		const result = hook.current.resolvedTheme;

		expect(result).toBe(expectedResult);
	});

	it("should apply the 'dark' class when the OS preference changes to dark on the system choice", () => {
		const changeListeners = stubMatchMedia();
		renderHook(() => useTheme());

		const expectedResult = true;

		act(() => {
			for (const notify of changeListeners) {
				notify({ matches: true } as MediaQueryListEvent);
			}
		});
		const result = document.documentElement.classList.contains("dark");

		expect(result).toBe(expectedResult);
	});
});

/**
 * Replaces `window.matchMedia` with a stub that starts unmatched and collects
 * the `change` listeners the hook registers, so a test fires them by hand.
 *
 * @returns The collected listeners, filled once the hook has mounted.
 */
function stubMatchMedia(): Array<(event: MediaQueryListEvent) => void> {
	const changeListeners: Array<(event: MediaQueryListEvent) => void> = [];

	vi.spyOn(window, "matchMedia").mockImplementation(
		(query: string) =>
			({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: (
					_type: string,
					listener: (event: MediaQueryListEvent) => void,
				) => {
					changeListeners.push(listener);
				},
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}) as unknown as MediaQueryList,
	);

	return changeListeners;
}
