import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import type { ThemeChoice } from "@/lib/theme/theme";

import { ThemeToggle } from "./theme-toggle";

/**
 * A stateful wrapper so the control behaves like it does in the header: the
 * pressed option follows the selection.
 */
function ThemeToggleStory({ initial }: { initial: ThemeChoice }) {
	const [choice, setChoice] = useState<ThemeChoice>(initial);

	return <ThemeToggle value={choice} onChange={setChoice} />;
}

/**
 * The `Theme Toggle` is a segmented control that switches the site between
 * light, dark, and a system option that follows the operating system
 * preference. It is controlled: the header wires it to the theme source, so the
 * pressed option reads the active choice and each selection persists it.
 */
const meta: Meta<typeof ThemeToggleStory> = {
	title: "Components/Theme Toggle",
	component: ThemeToggleStory,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	args: {
		initial: "system",
	},
	argTypes: {
		initial: {
			control: "inline-radio",
			options: ["light", "dark", "system"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for the theme toggle.
 */
export const Playground: Story = {};

// ==========================================
// STATE STORIES
// ==========================================

/**
 * The light option pressed.
 */
export const Light: Story = {
	args: { initial: "light" },
	argTypes: { initial: { control: { disable: true } } },
};

/**
 * The dark option pressed.
 */
export const Dark: Story = {
	args: { initial: "dark" },
	argTypes: { initial: { control: { disable: true } } },
};

/**
 * The system option pressed, which follows the operating system preference.
 */
export const System: Story = {
	args: { initial: "system" },
	argTypes: { initial: { control: { disable: true } } },
};

// ==========================================
// INTERACTION TESTS
// ==========================================

/**
 * Play test: selecting the dark option moves the pressed state onto it.
 */
export const SelectsThemeOnClick: Story = {
	args: { initial: "system" },
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const dark = canvas.getByRole("button", { name: "Dark theme" });

		const expectedResult = "true";

		await userEvent.click(dark);
		const result = dark.getAttribute("aria-pressed");

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: clicking the pressed option keeps it pressed, so a theme stays
 * applied instead of leaving the control with nothing selected.
 */
export const KeepsSelectionWhenPressedAgain: Story = {
	args: { initial: "dark" },
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const dark = canvas.getByRole("button", { name: "Dark theme" });

		const expectedResult = "true";

		await userEvent.click(dark);
		const result = dark.getAttribute("aria-pressed");

		await expect(result).toBe(expectedResult);
	},
};
