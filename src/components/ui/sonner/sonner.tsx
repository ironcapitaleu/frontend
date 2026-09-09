import { type CSSProperties, useEffect, useState } from "react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

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

/**
 * `Toaster` mounts the toast portal once near the app root. Any module then
 * raises non-blocking feedback through the re-exported `toast` API, so a form
 * submission or a save reports its outcome without a modal.
 *
 * The toaster follows the app's class-based theme: it reads the `.dark` class on
 * the document root and repaints when that class changes. Neutral toasts take
 * the design system's `popover` tokens, and `richColors` gives `toast.success`,
 * `toast.error`, and `toast.info` their matching accents.
 */
function Toaster(props: ToasterProps) {
	const isDark = useDarkTheme();

	return (
		<SonnerToaster
			theme={isDark ? "dark" : "light"}
			richColors
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as CSSProperties
			}
			{...props}
		/>
	);
}

export { Toaster };
