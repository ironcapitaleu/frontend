/**
 * Theme-playground control mapping.
 *
 * Deviations (AGENTS.md): this playground emits raw color and length values
 * rather than reading the semantic tokens. A theme editor exists to produce
 * those values, so the project rule of "semantic tokens only, no raw hex or
 * oklch" does not fit the playground's own controls. The deviation stays inside
 * the playground. The primitives it renders still read the tokens, which is why
 * the mapping below sets the tokens on one wrapper element. It never touches
 * `:root`, so a change here reaches only the story that renders the wrapper and
 * every other story keeps the shared theme.
 */

/**
 * The theme settings the playground exposes as Storybook controls.
 *
 * Each color field holds a CSS color string, or an empty string to leave that
 * token at its active-theme value. The two length fields always carry a number,
 * and their defaults match the shared theme.
 */
export interface ThemeControls {
	/** The accent color for primary buttons and badges. */
	primary: string;
	/** The text color that sits on a primary surface. */
	primaryForeground: string;
	/** The color for secondary buttons and badges. */
	secondary: string;
	/** The page background behind the primitives. */
	background: string;
	/** The body text color. */
	foreground: string;
	/** The color for borders, inputs, and separators. */
	border: string;
	/** The corner radius in pixels. */
	radius: number;
	/** The base spacing unit in rem, which scales gaps and padding. */
	spacing: number;
}

/** The token names that each color control writes to. */
const COLOR_TOKENS: ReadonlyArray<readonly [keyof ThemeControls, string]> = [
	["primary", "--primary"],
	["primaryForeground", "--primary-foreground"],
	["secondary", "--secondary"],
	["background", "--background"],
	["foreground", "--foreground"],
	["border", "--border"],
];

/**
 * Turns the playground controls into CSS custom properties for a wrapper
 * element. The two length tokens are always set. A color token is set only when
 * its control holds a value, so an empty control leaves that token at the
 * active-theme value and the theme toggle still governs it.
 *
 * @param controls - The current control values from the Storybook args.
 * @returns A style object of CSS custom properties to spread onto one wrapper.
 */
export function themeVars(controls: ThemeControls): Record<string, string> {
	const vars: Record<string, string> = {
		"--radius": `${controls.radius}px`,
		"--spacing": `${controls.spacing}rem`,
	};

	for (const [key, token] of COLOR_TOKENS) {
		const value = controls[key] as string;
		if (value.trim() !== "") {
			vars[token] = value;
		}
	}

	return vars;
}
