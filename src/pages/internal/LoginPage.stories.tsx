import type { Meta, StoryObj } from "@storybook/react-vite";

import { MemoryRouter } from "react-router";

import { AuthProvider } from "../../contexts/AuthContext";
import { alwaysUnauthenticatedAuth } from "../../test/fixtures/auth/always-unauthenticated";
import LoginPage from "./LoginPage";

/**
 * The sign-in page: a centered card with the brand mark, the account heading,
 * the passkey continue button, and the sign-in / create-account toggle. It
 * reads auth state from `AuthProvider` and redirects a signed-in visitor home,
 * so the story wraps a signed-out gateway and a router to render the form.
 * The decorator mirrors `Layout` (a full-height flex column) so the card
 * centers in the viewport the way it does in the running app.
 */
const meta: Meta<typeof LoginPage> = {
	title: "Pages/LoginPage",
	component: LoginPage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<AuthProvider gateway={alwaysUnauthenticatedAuth()}>
				<MemoryRouter>
					<div className="min-h-screen flex flex-col">
						<Story />
					</div>
				</MemoryRouter>
			</AuthProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

/** The signed-out sign-in view with the passkey button and account toggle. */
export const Default: Story = {};
