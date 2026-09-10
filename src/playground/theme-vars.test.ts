import { describe, expect, it } from "vitest";

import { type ThemeControls, themeVars } from "./theme-vars";

const BASE_CONTROLS: ThemeControls = {
	primary: "",
	primaryForeground: "",
	secondary: "",
	background: "",
	foreground: "",
	border: "",
	radius: 10,
	spacing: 0.25,
};

describe("themeVars", () => {
	it("should write the radius as a pixel token when given a radius", () => {
		// Arrange
		const controls: ThemeControls = { ...BASE_CONTROLS, radius: 16 };
		// Define
		const expected = "16px";

		// Act
		const vars = themeVars(controls);

		// Assert
		expect(vars["--radius"]).toBe(expected);
	});

	it("should write the spacing as a rem token when given a spacing", () => {
		// Arrange
		const controls: ThemeControls = { ...BASE_CONTROLS, spacing: 0.4 };
		// Define
		const expected = "0.4rem";

		// Act
		const vars = themeVars(controls);

		// Assert
		expect(vars["--spacing"]).toBe(expected);
	});

	it("should set the primary token when the control holds a color", () => {
		// Arrange
		const controls: ThemeControls = { ...BASE_CONTROLS, primary: "#ff0000" };
		// Define
		const expected = "#ff0000";

		// Act
		const vars = themeVars(controls);

		// Assert
		expect(vars["--primary"]).toBe(expected);
	});

	it("should omit a color token when the control is empty", () => {
		// Arrange
		const controls: ThemeControls = { ...BASE_CONTROLS, secondary: "" };
		// Define
		const expected = false;

		// Act
		const vars = themeVars(controls);

		// Assert
		expect("--secondary" in vars).toBe(expected);
	});

	it("should omit a color token when the control holds only whitespace", () => {
		// Arrange
		const controls: ThemeControls = { ...BASE_CONTROLS, background: "   " };
		// Define
		const expected = false;

		// Act
		const vars = themeVars(controls);

		// Assert
		expect("--background" in vars).toBe(expected);
	});
});
