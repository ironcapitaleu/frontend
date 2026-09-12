import type { Meta, StoryObj } from "@storybook/react-vite";

import { captureVisualSnapshots } from "../../.storybook/utils/visualSnapshot";
import { GlowNavBar } from "./GlowNavBar";

/**
 * A horizontal nav bar with gradient glow effect on hover.
 * Each item expands to reveal its label when hovered, with a colored gradient
 * glow behind it. Uses Lucide icons and Inter Variable for typography.
 *
 * Based on: https://www.youtube.com/watch?v=yE_CKgG9gcQ
 */
const meta: Meta<typeof GlowNavBar> = {
	title: "Components/GlowNavBar",
	component: GlowNavBar,
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className="flex min-h-[200px] items-center justify-center rounded-xl bg-muted p-8">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof GlowNavBar>;

/**
 * Default state of the GlowNavBar.
 * Hover over each icon to see the gradient glow expand and reveal the label.
 */
export const Default: Story = {};

// ==========================================
// VISUAL REGRESSION
// ==========================================
//
// These two stories are the first component covered by the third test layer
// (TESTING.md section 3). They hold no controls and document nothing, so they
// stay out of the sidebar and out of the autodocs page. They still run as
// ordinary render tests, and they capture images only when VISUAL=1 is set.
//
// One story per theme, because the theme is a story global rather than
// something a play function switches. The helper loops the viewports.
//
// The baseline name is the story id rather than a hand-written string. Two
// stories in one file cannot then collide on one baseline, which would
// otherwise make each run overwrite the other and commit churn forever.

/** Captures the nav bar on the light theme, at every covered viewport. */
export const VisualLightTheme: Story = {
	name: "Visual: light theme",
	tags: ["!dev", "!autodocs"],
	globals: { theme: "light" },
	play: async ({ id }) => {
		await captureVisualSnapshots(id);
	},
};

/** Captures the nav bar on the dark theme, at every covered viewport. */
export const VisualDarkTheme: Story = {
	name: "Visual: dark theme",
	tags: ["!dev", "!autodocs"],
	globals: { theme: "dark" },
	play: async ({ id }) => {
		await captureVisualSnapshots(id);
	},
};
