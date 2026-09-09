import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../label";
import { Switch } from ".";

/**
 * A `Switch` turns one setting on or off, and the change takes effect at once.
 * Reach for it when the setting acts the moment it flips, such as a live data
 * feed in a filter panel. For a choice that only counts once the reader submits
 * the form, use a checkbox instead.
 *
 * The track and thumb read from semantic tokens, so both repaint with the
 * Storybook theme toggle. Pair the switch with a `Label` that points at its
 * `id`, so a click on the text flips it too.
 */
const meta: Meta<typeof Switch> = {
	title: "Components/Switch",
	component: Switch,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		defaultChecked: {
			control: "boolean",
			description: "Whether the switch starts in the on state.",
		},
		disabled: {
			control: "boolean",
			description: "Whether the switch ignores clicks and key presses.",
		},
		className: { control: { disable: true } },
	},
	args: {
		defaultChecked: false,
		disabled: false,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Drive the two states from the Controls panel. Click the label or the track,
 * or tab to the switch and press Space.
 */
export const Default: Story = {
	render: (args) => (
		<div className="flex items-center gap-2">
			<Switch id="live-prices" {...args} />
			<Label htmlFor="live-prices">Live prices</Label>
		</div>
	),
};

/**
 * The four states side by side: off, on, and each of those turned off for the
 * reader. A disabled switch keeps its state and fades to half opacity.
 */
export const States: Story = {
	render: () => (
		<div className="grid gap-3">
			<div className="flex items-center gap-2">
				<Switch id="state-off" />
				<Label htmlFor="state-off">Off</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch id="state-on" defaultChecked />
				<Label htmlFor="state-on">On</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch id="state-off-disabled" disabled />
				<Label htmlFor="state-off-disabled">Off and disabled</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch id="state-on-disabled" defaultChecked disabled />
				<Label htmlFor="state-on-disabled">On and disabled</Label>
			</div>
		</div>
	),
};
