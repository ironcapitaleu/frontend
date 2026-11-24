import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, userEvent, within } from "storybook/test";

import { AuthProvider } from "../../contexts/AuthContext";
import type { AuthGateway } from "../../lib/auth/gateway";
import { alwaysAuthenticatedAuth } from "../../test/fixtures/auth/always-authenticated";
import { alwaysUnauthenticatedAuth } from "../../test/fixtures/auth/always-unauthenticated";
import LoginPage from "./LoginPage";

const signedOut = alwaysUnauthenticatedAuth();
const signedIn = alwaysAuthenticatedAuth();

/**
 * The one page for sign-in and sign-up, without a password: the provider
 * buttons, the email form, and the consent line. After the email step, the page
 * asks for the code from the mail. A signed-in visitor sees the email and a
 * sign-out button. Each story injects an auth gateway through the `gateway`
 * parameter. The decorator mirrors `Layout` (a full-height flex column), so the
 * column centers in the viewport the way it does in the running app.
 */
const meta: Meta<typeof LoginPage> = {
	title: "Pages/LoginPage",
	component: LoginPage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		gateway: signedOut,
	},
	decorators: [
		(Story, { parameters }) => (
			<AuthProvider gateway={parameters.gateway as AuthGateway}>
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

/** The signed-out email step with the provider buttons and the consent line. */
export const Default: Story = {};

/** The signed-out email step at a phone width. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};

/** The code step after the visitor submits an email. */
export const CheckEmail: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "Check your email";

		await userEvent.type(
			await canvas.findByLabelText("Email"),
			"you@example.com",
		);
		await userEvent.click(
			canvas.getByRole("button", { name: "Continue with email" }),
		);
		const result = await canvas.findByRole("heading", { level: 1 });

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** The code step with the Supabase error for a wrong or expired code. */
export const WrongCode: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "Token has expired or is invalid";

		await userEvent.type(
			await canvas.findByLabelText("Email"),
			"you@example.com",
		);
		await userEvent.click(
			canvas.getByRole("button", { name: "Continue with email" }),
		);
		await userEvent.type(await canvas.findByLabelText("Code"), "000000");
		await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
		const result = await canvas.findByRole("alert");

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** The signed-in state with the email of the account and a sign-out button. */
export const SignedIn: Story = {
	parameters: { gateway: signedIn },
};
