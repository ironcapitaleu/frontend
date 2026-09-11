import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import SitemapPage from "./SitemapPage";

/**
 * The Sitemap page: a static, three-column index of the site's routes grouped
 * under Iron Capital, Tools, and Account. It holds no state and takes no props,
 * so its single meaningful state is the rendered link index — captured here for
 * the visual (Layer 2) record. Wrapped in a `MemoryRouter` because every entry
 * is a react-router `<Link>`.
 */
const meta: Meta<typeof SitemapPage> = {
	title: "Pages/SitemapPage",
	component: SitemapPage,
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
type Story = StoryObj<typeof SitemapPage>;

/** The full sitemap with every section and link. */
export const Default: Story = {};
