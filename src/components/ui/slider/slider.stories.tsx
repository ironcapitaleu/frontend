import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../label";
import { Slider } from ".";

/**
 * A `Slider` lets the reader drag a thumb along a track to pick a number, or a
 * range when it carries two values. Use it where the place in a range matters
 * more than the exact figure, such as a market-cap filter. When the reader
 * needs a precise entry, pair it with a number input or use one instead.
 *
 * The track and thumb read from semantic tokens, so both repaint with the
 * Storybook theme toggle. Arrow keys move the focused thumb by one `step`.
 */
const meta: Meta<typeof Slider> = {
	title: "Components/Slider",
	component: Slider,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		min: {
			control: { type: "number" },
			description: "Lowest number the slider can reach.",
		},
		max: {
			control: { type: "number" },
			description: "Highest number the slider can reach.",
		},
		step: {
			control: { type: "number", min: 1, max: 25, step: 1 },
			description: "Distance between the numbers the thumb lands on.",
		},
		disabled: {
			control: "boolean",
			description: "Whether the slider ignores drags and key presses.",
		},
		orientation: {
			control: "inline-radio",
			options: ["horizontal", "vertical"],
			description: "Which way the track runs.",
		},
		className: { control: { disable: true } },
	},
	args: {
		min: 0,
		max: 100,
		step: 1,
		disabled: false,
		orientation: "horizontal",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One thumb on a track, driven from the Controls panel. Drag it, or tab to it
 * and use the arrow keys.
 */
export const Default: Story = {
	render: (args) => (
		<div className="w-72">
			<Slider aria-label="Weighting" defaultValue={40} {...args} />
		</div>
	),
};

/**
 * Two thumbs pick a range. Pass an array of two numbers and the slider fills
 * the track between them.
 */
export const Range: Story = {
	render: (args) => (
		<div className="w-72">
			<Slider defaultValue={[25, 75]} {...args} />
		</div>
	),
};

/**
 * A wider `step` snaps the thumb to coarser numbers, and a `min` and `max` pair
 * bounds it. This one moves in tens between 0 and 200.
 */
export const SteppedRange: Story = {
	render: () => (
		<div className="grid w-72 gap-2">
			<Label htmlFor="market-cap">Market cap in billions</Label>
			<Slider id="market-cap" defaultValue={[50, 150]} max={200} step={10} />
		</div>
	),
};

/**
 * A disabled slider keeps its value and fades to half opacity. It takes no
 * drags and no key presses.
 */
export const Disabled: Story = {
	render: () => (
		<div className="w-72">
			<Slider aria-label="Weighting" defaultValue={40} disabled />
		</div>
	),
};
