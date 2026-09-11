import { describe, expect, it } from "vitest";

import {
	applyResolvedTheme,
	isThemeChoice,
	readStoredChoice,
	resolveTheme,
	storeChoice,
	THEME_STORAGE_KEY,
} from "./theme";

/** A minimal in-memory storage that records the last written value. */
function fakeStorage(initial: string | null = null) {
	let value = initial;
	return {
		getItem: () => value,
		setItem: (_key: string, next: string) => {
			value = next;
		},
		read: () => value,
	};
}

describe("isThemeChoice", () => {
	it("should accept a known choice when the value is 'system'", () => {
		const expectedResult = true;

		const result = isThemeChoice("system");

		expect(result).toBe(expectedResult);
	});

	it("should reject an unknown value when the value is 'sepia'", () => {
		const expectedResult = false;

		const result = isThemeChoice("sepia");

		expect(result).toBe(expectedResult);
	});

	it("should reject a missing value when the value is null", () => {
		const expectedResult = false;

		const result = isThemeChoice(null);

		expect(result).toBe(expectedResult);
	});
});

describe("readStoredChoice", () => {
	it("should return the stored choice when a valid one is present", () => {
		const storage = fakeStorage("light");

		const expectedResult = "light";

		const result = readStoredChoice(storage);

		expect(result).toBe(expectedResult);
	});

	it("should default to 'system' when nothing is stored", () => {
		const storage = fakeStorage(null);

		const expectedResult = "system";

		const result = readStoredChoice(storage);

		expect(result).toBe(expectedResult);
	});

	it("should default to 'system' when the stored value is not a known choice", () => {
		const storage = fakeStorage("sepia");

		const expectedResult = "system";

		const result = readStoredChoice(storage);

		expect(result).toBe(expectedResult);
	});
});

describe("storeChoice", () => {
	it("should persist the choice under the theme storage key", () => {
		const storage = fakeStorage();

		const expectedResult = "dark";

		storeChoice(storage, "dark");
		const result = storage.read();

		expect(result).toBe(expectedResult);
	});

	it("should use the documented storage key so the pre-paint script reads it", () => {
		const expectedResult = "theme";

		const result = THEME_STORAGE_KEY;

		expect(result).toBe(expectedResult);
	});
});

describe("resolveTheme", () => {
	it("should map an explicit 'light' choice to light regardless of the OS preference", () => {
		const expectedResult = "light";

		const result = resolveTheme("light", true);

		expect(result).toBe(expectedResult);
	});

	it("should map an explicit 'dark' choice to dark regardless of the OS preference", () => {
		const expectedResult = "dark";

		const result = resolveTheme("dark", false);

		expect(result).toBe(expectedResult);
	});

	it("should resolve 'system' to dark when the OS prefers dark", () => {
		const expectedResult = "dark";

		const result = resolveTheme("system", true);

		expect(result).toBe(expectedResult);
	});

	it("should resolve 'system' to light when the OS does not prefer dark", () => {
		const expectedResult = "light";

		const result = resolveTheme("system", false);

		expect(result).toBe(expectedResult);
	});
});

describe("applyResolvedTheme", () => {
	it("should add the 'dark' class when the resolved theme is dark", () => {
		const root = document.createElement("html");

		const expectedResult = true;

		applyResolvedTheme(root, "dark");
		const result = root.classList.contains("dark");

		expect(result).toBe(expectedResult);
	});

	it("should remove the 'dark' class when the resolved theme is light", () => {
		const root = document.createElement("html");
		root.classList.add("dark");

		const expectedResult = false;

		applyResolvedTheme(root, "light");
		const result = root.classList.contains("dark");

		expect(result).toBe(expectedResult);
	});

	it("should set the color-scheme to match the resolved theme", () => {
		const root = document.createElement("html");

		const expectedResult = "light";

		applyResolvedTheme(root, "light");
		const result = root.style.colorScheme;

		expect(result).toBe(expectedResult);
	});
});
