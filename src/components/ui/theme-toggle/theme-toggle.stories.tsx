import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import type { ThemeChoice } from "@/lib/theme/theme";

import { ThemeToggle } from "./theme-toggle";

/**
 * A stateful wrapper so the control behaves like it does in the header: the
 * trigger and the checked item follow the selection.
 */
function ThemeToggleStory({ initial }: { initial: ThemeChoice }) {
	const [choice, setChoice] = useState<ThemeChoice>(initial);

	return <ThemeToggle value={choice} onChange={setChoice} />;
}

/**
 * The `Theme Toggle` selects the light, dark, or system theme. The system
 * option follows the operating system preference. The trigger names the active
 * choice, so the control reads clearly before it is opened.
 *
 * It is controlled: the header wires it to the theme source, so the checked
 * item reflects the active choice and each pick persists it.
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
 * The light theme selected.
 */
export const Light: Story = {
	args: { initial: "light" },
	argTypes: { initial: { control: { disable: true } } },
};

/**
 * The dark theme selected.
 */
export const Dark: Story = {
	args: { initial: "dark" },
	argTypes: { initial: { control: { disable: true } } },
};

/**
 * The system option selected, which follows the operating system preference.
 */
export const System: Story = {
	args: { initial: "system" },
	argTypes: { initial: { control: { disable: true } } },
};

// ==========================================
// INTERACTION TESTS
// ==========================================

/**
 * The open menu, showing all three options with the active one checked.
 */
export const MenuOpen: Story = {
	args: { initial: "system" },
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "true";

		await userEvent.click(canvas.getByRole("button"));
		const system = await within(document.body).findByRole("menuitemradio", {
			name: "System",
		});
		const result = system.getAttribute("aria-checked");

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: picking an option from the menu moves the selection to it.
 */
export const SelectsThemeFromMenu: Story = {
	args: { initial: "system" },
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "Theme: Dark";

		await userEvent.click(canvas.getByRole("button"));
		const dark = await within(document.body).findByRole("menuitemradio", {
			name: "Dark",
		});
		await userEvent.click(dark);
		const result = canvas.getByRole("button").getAttribute("aria-label");

		await expect(result).toBe(expectedResult);
	},
};
