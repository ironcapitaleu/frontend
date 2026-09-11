import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import PrivacyPage from "./PrivacyPage";

/**
 * The Privacy Policy page: static legal copy in stacked sections (who we are,
 * data collected, purpose, processors, retention, rights, contact). It holds no
 * state and takes no props, so its single meaningful state is the rendered
 * document — captured here for the visual (Layer 2) record. Wrapped in a
 * `MemoryRouter` because the "contact form" reference is a react-router `<Link>`.
 */
const meta: Meta<typeof PrivacyPage> = {
	title: "Pages/PrivacyPage",
	component: PrivacyPage,
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
type Story = StoryObj<typeof PrivacyPage>;

/** The complete privacy policy with every section. */
export const Default: Story = {};
