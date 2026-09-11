/**
 * The theme the visitor selects. `system` follows the operating system
 * preference through the `prefers-color-scheme` media query.
 */
export type ThemeChoice = "light" | "dark" | "system";

/**
 * The theme actually applied to the document. A `system` choice resolves to one
 * of these two before it reaches the DOM.
 */
export type ResolvedTheme = "light" | "dark";

/**
 * The `localStorage` key that holds the visitor's theme choice.
 *
 * The pre-paint inline script in `index.html` reads the same key by its literal
 * value, so a rename here needs the same rename there.
 */
export const THEME_STORAGE_KEY = "theme";

/** The choices the toggle offers, in display order. */
export const THEME_CHOICES = [
	"light",
	"dark",
	"system",
] as const satisfies readonly ThemeChoice[];

/**
 * Reports whether an arbitrary string is one of the known theme choices.
 *
 * Why guard? The stored value comes from `localStorage`, which any script or a
 * hand edit writes, so it is untrusted until it is checked.
 *
 * @param value - The raw string read from storage, or `null` when absent.
 * @returns `true` when `value` is a valid {@link ThemeChoice}.
 */
export function isThemeChoice(value: string | null): value is ThemeChoice {
	return value === "light" || value === "dark" || value === "system";
}

/**
 * Reads the persisted theme choice, defaulting to `system` when none is stored
 * or when the stored value is not a known choice.
 *
 * @param storage - The storage to read from (production passes
 * `window.localStorage`, tests pass a fake).
 * @returns The stored {@link ThemeChoice}, or `system` as the default.
 */
export function readStoredChoice(
	storage: Pick<Storage, "getItem">,
): ThemeChoice {
	const stored = storage.getItem(THEME_STORAGE_KEY);
	return isThemeChoice(stored) ? stored : "system";
}

/**
 * Persists the theme choice so a reload and a new tab read it back.
 *
 * @param storage - The storage to write to.
 * @param choice - The choice to persist.
 */
export function storeChoice(
	storage: Pick<Storage, "setItem">,
	choice: ThemeChoice,
): void {
	storage.setItem(THEME_STORAGE_KEY, choice);
}

/**
 * Resolves a choice into the concrete theme to apply. A `system` choice reads
 * the operating system preference, every other choice maps to itself.
 *
 * @param choice - The visitor's theme choice.
 * @param prefersDark - Whether the `prefers-color-scheme: dark` query matches.
 * @returns The {@link ResolvedTheme} to apply to the document.
 */
export function resolveTheme(
	choice: ThemeChoice,
	prefersDark: boolean,
): ResolvedTheme {
	if (choice === "system") {
		return prefersDark ? "dark" : "light";
	}
	return choice;
}

/**
 * Applies a resolved theme to the document root by toggling the `.dark` class
 * that the semantic tokens key off, and by setting `color-scheme` so native
 * form controls and scrollbars match.
 *
 * @param root - The document root element (`document.documentElement`).
 * @param resolved - The theme to apply.
 */
export function applyResolvedTheme(
	root: HTMLElement,
	resolved: ResolvedTheme,
): void {
	root.classList.toggle("dark", resolved === "dark");
	root.style.colorScheme = resolved;
}
