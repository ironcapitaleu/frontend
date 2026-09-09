import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import { Toaster, toast } from ".";

/**
 * A `Toaster` mounts the toast portal once near the app root, then any module
 * raises non-blocking feedback through the `toast` API. Use it for the outcome
 * of an action, such as a saved form or a failed request, when a modal
 * interrupts more than the message is worth.
 *
 * The toaster follows the app's class-based theme, so the toasts repaint with
 * the Storybook theme toggle. `richColors` gives success, error, and info their
 * own accent.
 *
 * `sonner` holds one global toast store shared by every `Toaster`, so a raised
 * toast lives until its own timeout regardless of which story is open. The
 * single story below raises all three kinds from one toaster for that reason,
 * rather than splitting them across separate stories that leak each other's
 * toasts.
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
 * Each button raises one toast, so the success, error, and info accents show
 * together. A toast stays until it times out, so raising all three stacks them.
 */
export const Default: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-3">
			<Button
				variant="outline"
				onClick={() => toast.success("Company saved to your list.")}
			>
				Show success
			</Button>
			<Button variant="outline" onClick={() => toast.error("The save failed.")}>
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
