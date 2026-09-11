import { useCallback, useEffect, useState } from "react";

import {
	applyResolvedTheme,
	readStoredChoice,
	resolveTheme,
	storeChoice,
	type ResolvedTheme,
	type ThemeChoice,
} from "../lib/theme/theme";

/** The media query that reports the operating system dark preference. */
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Reads the OS dark preference, defaulting to `false` when `matchMedia` is
 * absent or throws. The pre-paint script in `index.html` guards the same call.
 */
function systemPrefersDark(): boolean {
	try {
		return window.matchMedia(DARK_QUERY).matches;
	} catch {
		return false;
	}
}

/**
 * Reads the stored choice, defaulting to `system` when storage access throws.
 * Some privacy contexts throw on `window.localStorage` access, and the app must
 * still mount there, so this mirrors the guard in the pre-paint script.
 */
function readChoiceSafely(): ThemeChoice {
	try {
		return readStoredChoice(window.localStorage);
	} catch {
		return "system";
	}
}

/** The theme state a consumer reads and drives. */
export interface ThemeState {
	/** The visitor's current choice. */
	choice: ThemeChoice;
	/** The theme applied to the document once `system` is resolved. */
	resolvedTheme: ResolvedTheme;
	/** Persists a new choice and re-resolves the applied theme. */
	setChoice: (choice: ThemeChoice) => void;
}

/**
 * Owns the theme for the running app: it reads the persisted choice on load,
 * tracks the operating system preference for a `system` choice, and applies the
 * resolved theme to the document root whenever either changes.
 *
 * The resolve-and-persist logic lives in pure functions in `lib/theme/theme.ts`,
 * so this hook only wires them to React state, `window`, and the DOM.
 *
 * @returns The {@link ThemeState} to expose through the provider.
 */
export function useTheme(): ThemeState {
	const [choice, setChoiceState] = useState<ThemeChoice>(readChoiceSafely);
	const [prefersDark, setPrefersDark] = useState<boolean>(systemPrefersDark);

	useEffect(() => {
		let media: MediaQueryList;
		try {
			media = window.matchMedia(DARK_QUERY);
		} catch {
			return;
		}
		const handleChange = (event: MediaQueryListEvent) => {
			setPrefersDark(event.matches);
		};
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, []);

	const resolvedTheme = resolveTheme(choice, prefersDark);

	useEffect(() => {
		applyResolvedTheme(document.documentElement, resolvedTheme);
	}, [resolvedTheme]);

	const setChoice = useCallback((next: ThemeChoice) => {
		try {
			storeChoice(window.localStorage, next);
		} catch {
			// Ignore write failures and keep applying the choice in-session.
		}
		setChoiceState(next);
	}, []);

	return { choice, resolvedTheme, setChoice };
}
