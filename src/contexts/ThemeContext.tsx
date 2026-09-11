import { createContext, useContext, type ReactNode } from "react";

import { useTheme, type ThemeState } from "../hooks/useTheme";

const ThemeContext = createContext<ThemeState | undefined>(undefined);

/**
 * Provides the theme state to the tree so any component reads the current choice
 * and drives the toggle. Mount it once at the app root.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const theme = useTheme();

	return (
		<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
	);
}

/**
 * Returns the theme context of the nearest {@link ThemeProvider}.
 *
 * @throws Error when used outside a `ThemeProvider` — every consumer must sit
 * under the provider.
 */
export function useThemeContext(): ThemeState {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useThemeContext must be used within a ThemeProvider");
	}
	return context;
}
