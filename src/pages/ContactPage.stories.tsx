import type { Meta, StoryObj } from "@storybook/react-vite";

import { MemoryRouter } from "react-router";

import ContactPage from "./ContactPage";

/**
 * The contact page: a two-column band with the get-in-touch heading, the
 * address and email column, and the message form built from the form-control
 * primitives. The form reads a Turnstile token before it enables the submit
 * button. The default story leaves the token unset (the production state), so
 * the button stays disabled the way it does before the widget resolves. The
 * decorator mirrors `Layout` (a full-height flex column) so the band fills the
 * viewport, and a router backs the Privacy Policy link in the consent row.
 */
const meta: Meta<typeof ContactPage> = {
	title: "Pages/ContactPage",
	component: ContactPage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<div className="min-h-screen flex flex-col">
					<Story />
				</div>
			</MemoryRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ContactPage>;

/**
 * The contact form before a Turnstile token lands, so the submit button is
 * disabled. The always-block test key holds that state in a real browser too,
 * where the hidden widget otherwise resolves and enables the button.
 */
export const Default: Story = {
	args: {
		turnstileSiteKey: "2x00000000000000000000AB",
	},
};

/** The ready-to-send state, with a Turnstile token seeded so the button is live. */
export const ReadyToSend: Story = {
	args: {
		initialTurnstileToken: "storybook-token",
	},
};
