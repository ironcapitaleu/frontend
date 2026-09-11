import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import AboutPage from "./AboutPage";

/**
 * The About page: the product's classical voice, stated in stacked sections
 * (the opening statement, then Timeless Principles, Security Analysis, and Our
 * Method). It holds no state and takes no props, so its single meaningful state
 * is the rendered document — captured here for the visual (Layer 2) record.
 * Wrapped in a `MemoryRouter` for parity with the app's provider tree.
 */
const meta: Meta<typeof AboutPage> = {
	title: "Pages/AboutPage",
	component: AboutPage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AboutPage>;

/** The full About page with every section. */
export const Default: Story = {};
