import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from ".";

/**
 * A `RadioGroup` holds a set of options where exactly one stays selected. Use
 * it for a handful of options the reader compares side by side, such as a
 * reporting period. Past about six options, a `Select` reads better.
 *
 * The arrow keys move the selection and the group keeps a single tab stop, so
 * it reads as one control. Each `RadioGroupItem` renders the dot alone, so pair
 * it with a `Label` that points at its `id`.
 */
const meta: Meta<typeof RadioGroup> = {
	title: "Components/Radio Group",
	component: RadioGroup,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		defaultValue: {
			control: "inline-radio",
			options: ["quarterly", "half-yearly", "yearly"],
			description: "Which option starts selected.",
		},
		disabled: {
			control: "boolean",
			description: "Whether the whole group ignores clicks and key presses.",
		},
		className: { control: { disable: true } },
	},
	args: {
		defaultValue: "quarterly",
		disabled: false,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Three grouped options. Click one, or tab into the group and move the
 * selection with the arrow keys.
 */
export const Default: Story = {
	render: (args) => (
		<RadioGroup {...args}>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="quarterly" id="period-quarterly" />
				<Label htmlFor="period-quarterly">Quarterly</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="half-yearly" id="period-half-yearly" />
				<Label htmlFor="period-half-yearly">Half-yearly</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="yearly" id="period-yearly" />
				<Label htmlFor="period-yearly">Yearly</Label>
			</div>
		</RadioGroup>
	),
};

/**
 * A single option carries its own `disabled`, so the rest of the group stays
 * live. Use it for a choice the current data does not support.
 */
export const OneOptionDisabled: Story = {
	render: () => (
		<RadioGroup defaultValue="quarterly">
			<div className="flex items-center gap-2">
				<RadioGroupItem value="quarterly" id="single-quarterly" />
				<Label htmlFor="single-quarterly">Quarterly</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="monthly" id="single-monthly" disabled />
				<Label htmlFor="single-monthly">Monthly, not filed</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="yearly" id="single-yearly" />
				<Label htmlFor="single-yearly">Yearly</Label>
			</div>
		</RadioGroup>
	),
};

/**
 * `disabled` on the group turns off every option at once and keeps the current
 * selection on screen.
 */
export const GroupDisabled: Story = {
	render: () => (
		<RadioGroup defaultValue="yearly" disabled>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="quarterly" id="off-quarterly" />
				<Label htmlFor="off-quarterly">Quarterly</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="yearly" id="off-yearly" />
				<Label htmlFor="off-yearly">Yearly</Label>
			</div>
		</RadioGroup>
	),
};
