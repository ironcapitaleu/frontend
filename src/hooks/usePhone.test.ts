import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PHONE_QUERY, usePhone } from "./usePhone";

const stubMatchMedia = window.matchMedia;

/** Makes `window.matchMedia` match `PHONE_QUERY` only when `phone` is true. */
function screenIs(phone: boolean): void {
	window.matchMedia = (query: string) =>
		({
			...stubMatchMedia(query),
			matches: phone && query === PHONE_QUERY,
		}) as MediaQueryList;
}

describe("usePhone", () => {
	afterEach(() => {
		window.matchMedia = stubMatchMedia;
	});

	it("should be true when the screen is narrower than 768 px", () => {
		screenIs(true);

		const expectedResult = true;

		const result = renderHook(() => usePhone()).result.current;

		expect(result).toBe(expectedResult);
	});

	it("should be false when the screen is 768 px or wider", () => {
		screenIs(false);

		const expectedResult = false;

		const result = renderHook(() => usePhone()).result.current;

		expect(result).toBe(expectedResult);
	});
});
