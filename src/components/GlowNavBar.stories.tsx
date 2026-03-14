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
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "200px",
					background: "#f5f5f5",
					borderRadius: "12px",
					padding: "2rem",
				}}
			>
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
