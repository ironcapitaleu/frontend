import type { Meta, StoryObj } from "@storybook/react-vite";

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
