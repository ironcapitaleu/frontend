import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import NotFoundPage from "./NotFoundPage";

/**
 * The 404 page: a centered message shown for any unmatched route, with a large
 * decorative status number, a serif hero line, and a button back to the
 * homepage. It holds no state and takes no props, so its single meaningful
 * state is the rendered message — captured here for the visual (Layer 2)
 * record. Wrapped in a `MemoryRouter` because the return button is a
 * react-router `<Link>`.
 */
const meta: Meta<typeof NotFoundPage> = {
	title: "Pages/NotFoundPage",
	component: NotFoundPage,
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
type Story = StoryObj<typeof NotFoundPage>;

/** The full 404 page. */
export const Default: Story = {};
