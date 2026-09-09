import { type CSSProperties, useEffect, useState } from "react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Maps a neutral toast surface onto the design system's `popover` tokens, so an
 * ordinary toast matches the rest of the palette in both themes, and moves the
 * close button to the top-right corner. The reveal-on-hover styling for that
 * button lives in `index.css`.
 */
const TOKEN_STYLE: CSSProperties = {
	"--normal-bg": "var(--popover)",
	"--normal-text": "var(--popover-foreground)",
	"--normal-border": "var(--border)",
	"--toast-close-button-start": "unset",
	"--toast-close-button-end": "0",
	"--toast-close-button-transform": "translate(35%, -35%)",
} as CSSProperties;

/**
 * `Toaster` mounts the toast portal once near the app root. Any module then
 * raises non-blocking feedback through the re-exported `toast` API, so a form
 * submission or a save reports its outcome without a modal.
 *
 * The toaster follows the app's class-based theme: it reads the `.dark` class on
 * the document root and repaints when that class changes. Neutral toasts take
 * the design system's `popover` tokens. Each toast carries a close button that
 * stays hidden until the reader hovers or focuses the toast.
 *
 * Deviation (AGENTS.md "Deviations", DESIGN.md "semantic tokens only"): the
 * `success`, `error`, and `info` accents come from sonner's `richColors`
 * palette, not from semantic tokens. The design system defines only a
 * `destructive` token, with no `success`, `info`, or `warning` counterpart, so
 * there is no token set to map the three feedback kinds onto. `richColors` ships
 * both a light and a dark palette, so the accents still track the theme.
 */
function Toaster({ style, ...props }: ToasterProps) {
	const isDark = useDarkTheme();

	return (
		<SonnerToaster
			theme={isDark ? "dark" : "light"}
			richColors
			closeButton
			style={{ ...TOKEN_STYLE, ...style }}
			{...props}
		/>
	);
}

/**
 * Reads whether the app's class-based dark theme is active.
 *
 * The app carries its theme as a `.dark` class on the document root, the same
 * signal every other `ui/*` primitive themes from. This hook returns that state
 * and updates it through a `MutationObserver` when the class changes, so a theme
 * switch repaints the toaster in step with the rest of the page.
 */
function useDarkTheme(): boolean {
	const [isDark, setIsDark] = useState<boolean>(() =>
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		const root = document.documentElement;
		const readTheme = () => setIsDark(root.classList.contains("dark"));
		const observer = new MutationObserver(readTheme);

		observer.observe(root, { attributes: true, attributeFilter: ["class"] });
		readTheme();

		return () => observer.disconnect();
	}, []);

	return isDark;
}

export { Toaster };
