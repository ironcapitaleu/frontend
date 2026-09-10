import type { Meta, StoryObj } from "@storybook/react-vite";

import HomePage from "./HomePage";

/**
 * The landing page: a centered hero with the brand title, the product tagline,
 * and the `SearchBar`. It holds no state and takes no props, so its single
 * meaningful state is the rendered hero, captured here for the visual (Layer 2)
 * record.
 */
const meta: Meta<typeof HomePage> = {
	title: "Pages/HomePage",
	component: HomePage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof HomePage>;

/** The landing hero with the brand title, tagline, and search field. */
export const Default: Story = {};
