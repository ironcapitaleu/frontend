import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, userEvent, within } from "storybook/test";

import { AuthProvider } from "../../contexts/AuthContext";
import { alwaysUnauthenticatedAuth } from "../../test/fixtures/auth/always-unauthenticated";
import AuthConfirmPage from "./AuthConfirmPage";

const signedOut = alwaysUnauthenticatedAuth();

/**
 * The page that the link in the sign-in mail opens. It checks the token hash
 * only after the visitor clicks the button, so a mail scanner that opens the
 * link uses up nothing. Each story sets the URL through the `url` parameter.
 * The gateway rejects every link, so a click shows the Supabase error.
 */
const meta: Meta<typeof AuthConfirmPage> = {
	title: "Pages/AuthConfirmPage",
	component: AuthConfirmPage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		url: "/auth/confirm?token_hash=abc123&type=email",
	},
	decorators: [
		(Story, { parameters }) => (
			<AuthProvider gateway={signedOut}>
				<MemoryRouter initialEntries={[parameters.url as string]}>
					<div className="min-h-screen flex flex-col">
						<Story />
					</div>
				</MemoryRouter>
			</AuthProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AuthConfirmPage>;

/** The page as the link opens it, before the visitor clicks. */
export const Default: Story = {};

/** A link without a token hash. The button stays disabled. */
export const MissingToken: Story = {
	parameters: { url: "/auth/confirm" },
};

/** The Supabase error after a click on a wrong or expired link. */
export const WrongLink: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "Email link is invalid or has expired";

		await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
		const result = await canvas.findByRole("alert");

		await expect(result).toHaveTextContent(expectedResult);
	},
};
