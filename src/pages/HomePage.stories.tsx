import type { Meta, StoryObj } from "@storybook/react-vite";

import HomePage from "./HomePage";

/**
 * The landing page: a centered hero with the brand title, the product tagline,
 * and the `SearchBar`. It holds no state and takes no props, so its single
 * meaningful state is the rendered hero, captured here for the visual (Layer 2)
 * record. The decorator mirrors `Layout` (a full-height flex column) so the
 * hero centers in the viewport the way it does in the running app.
 */
const meta: Meta<typeof HomePage> = {
	title: "Pages/HomePage",
	component: HomePage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<div className="min-h-screen flex flex-col">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof HomePage>;

/** The landing hero with the brand title, tagline, and search field. */
export const Default: Story = {};
