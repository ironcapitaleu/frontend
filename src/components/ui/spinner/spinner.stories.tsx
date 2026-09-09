import type { Meta, StoryObj } from "@storybook/react-vite";

import { SizeShowcase } from "../../../../.storybook/utils/showcaseDecorators";
import { Spinner } from ".";

const SPINNER_SIZES = ["sm", "default", "lg", "xl"] as const;

/**
 * A `Spinner` is an indeterminate loading indicator — a rotating ring for waits
 * whose duration is unknown. It inherits the current text color, so a `text-*`
 * class recolors it, and `size` sets its diameter.
 */
const meta: Meta<typeof Spinner> = {
	title: "Components/Spinner",
	component: Spinner,
	tags: ["autodocs"],
	args: {
		size: "default",
		label: "Loading",
	},
	argTypes: {
		size: { control: "select", options: SPINNER_SIZES },
		label: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for the Spinner component.
 */
export const Playground: Story = {};

/**
 * Every size from `sm` to `xl`, side by side.
 */
export const Sizes: Story = {
	argTypes: {
		size: { control: { disable: true } },
	},
	render: () => (
		<SizeShowcase
			Component={
				Spinner as unknown as React.ComponentType<Record<string, unknown>>
			}
			sizes={[...SPINNER_SIZES]}
			sizeKey="size"
		/>
	),
};

/**
 * The spinner takes the current text color, so it recolors with `text-*`.
 */
export const Colored: Story = {
	argTypes: {
		size: { control: { disable: true } },
	},
	render: () => (
		<div className="flex items-center gap-6">
			<Spinner className="text-primary" />
			<Spinner className="text-destructive" />
			<Spinner className="text-foreground" />
		</div>
	),
};
