import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from ".";

const PROGRESS_SIZES = ["sm", "default", "lg"] as const;

/**
 * A `Progress` bar shows how far a known task has advanced, from `0` to `max`
 * (default `100`). Pass `value={null}` for a task of unknown length: the bar
 * fills and pulses to read as indeterminate.
 */
const meta: Meta<typeof Progress> = {
	title: "Components/Progress",
	component: Progress,
	tags: ["autodocs"],
	args: {
		value: 40,
		size: "default",
		"aria-label": "Loading",
	},
	argTypes: {
		value: { control: { type: "range", min: 0, max: 100, step: 1 } },
		size: { control: "select", options: PROGRESS_SIZES },
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground — drag `value` to move the bar.
 */
export const Playground: Story = {};

/**
 * Every track size, each at the same value.
 */
export const Sizes: Story = {
	argTypes: {
		size: { control: { disable: true } },
	},
	render: (args) => (
		<div className="flex flex-col gap-4">
			{PROGRESS_SIZES.map((size) => (
				<Progress key={size} {...args} size={size} />
			))}
		</div>
	),
};

/**
 * With no known completion amount, `value={null}` fills the bar and pulses.
 */
export const Indeterminate: Story = {
	args: { value: null },
	argTypes: {
		value: { control: { disable: true } },
	},
};
