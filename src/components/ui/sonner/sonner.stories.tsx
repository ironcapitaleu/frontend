import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import { Toaster, toast } from ".";

/**
 * A `Toaster` mounts the toast portal once near the app root, then any module
 * raises non-blocking feedback through the `toast` API. Use it for the outcome
 * of an action, such as a saved form or a failed request, when a modal would
 * interrupt more than the message is worth.
 *
 * The toaster follows the app's class-based theme, so the stories below repaint
 * with the Storybook theme toggle. `richColors` gives success, error, and info
 * their own accent.
 */
const meta: Meta<typeof Toaster> = {
	title: "Components/Toaster",
	component: Toaster,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The three feedback kinds, side by side. Each button raises one toast, so the
 * success, error, and info accents show together.
 */
export const Playground: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-3">
			<Button
				variant="outline"
				onClick={() => toast.success("Company saved to your list.")}
			>
				Show success
			</Button>
			<Button
				variant="outline"
				onClick={() => toast.error("The save could not be completed.")}
			>
				Show error
			</Button>
			<Button
				variant="outline"
				onClick={() => toast.info("New filings arrived overnight.")}
			>
				Show info
			</Button>
			<Toaster />
		</div>
	),
};

/**
 * A success toast confirms an action that finished as intended.
 */
export const Success: Story = {
	render: () => (
		<div>
			<Button
				variant="outline"
				onClick={() => toast.success("Company saved to your list.")}
			>
				Show success
			</Button>
			<Toaster />
		</div>
	),
};

/**
 * An error toast reports an action that failed, without blocking the page.
 */
export const ErrorToast: Story = {
	name: "Error",
	render: () => (
		<div>
			<Button
				variant="outline"
				onClick={() => toast.error("The save could not be completed.")}
			>
				Show error
			</Button>
			<Toaster />
		</div>
	),
};

/**
 * An info toast carries a neutral update the reader did not ask for.
 */
export const Info: Story = {
	render: () => (
		<div>
			<Button
				variant="outline"
				onClick={() => toast.info("New filings arrived overnight.")}
			>
				Show info
			</Button>
			<Toaster />
		</div>
	),
};
