import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Label } from "../label";
import { DatePicker } from ".";

/**
 * A `DatePicker` reads as an outline button that shows the chosen date, and
 * opens a calendar in a popover for picking one. Reach for it wherever a filter
 * or form needs a single date, such as a filing date.
 *
 * The trigger and the calendar read from semantic tokens, so both repaint with
 * the Storybook theme toggle. Pair the picker with a `Label` that points at its
 * `id`, so the field reads to a screen reader.
 */
const meta: Meta<typeof DatePicker> = {
	title: "Components/DatePicker",
	component: DatePicker,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		placeholder: {
			control: "text",
			description: "The trigger text before the reader picks a date.",
		},
		disabled: {
			control: "boolean",
			description: "Whether the picker ignores clicks and dims the trigger.",
		},
		value: { control: { disable: true } },
		defaultValue: { control: { disable: true } },
		onValueChange: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	args: {
		placeholder: "Pick a date",
		disabled: false,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Pick a single date. The picker holds its own state, so open the calendar,
 * choose a day, and the trigger shows the long-form date.
 */
export const Default: Story = {
	render: (args) => {
		const [date, setDate] = useState<Date | undefined>();
		return (
			<div className="flex flex-col gap-2">
				<Label htmlFor="filing-date">Filing date</Label>
				<DatePicker
					id="filing-date"
					value={date}
					onValueChange={setDate}
					{...args}
				/>
			</div>
		);
	},
};

/**
 * The empty state, with no date chosen yet. The trigger shows the placeholder
 * in the muted token until the reader picks a day.
 */
export const Empty: Story = {
	render: (args) => <DatePicker {...args} />,
};

/**
 * A date already chosen, so the trigger shows the long-form date instead of the
 * placeholder.
 */
export const Selected: Story = {
	args: {
		defaultValue: new Date(2026, 8, 9),
	},
};

/**
 * The disabled state. The trigger dims to half opacity and ignores clicks, so
 * the calendar stays closed.
 */
export const Disabled: Story = {
	args: {
		defaultValue: new Date(2026, 8, 9),
		disabled: true,
	},
};
