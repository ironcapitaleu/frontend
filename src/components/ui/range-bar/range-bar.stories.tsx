import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { RANGE_BAR_SIZES, RangeBar } from ".";

/**
 * A `RangeBar` shows where a value sits between a low and a high. The track is
 * a hairline in the `border` token and the marker is `foreground` ink, so the
 * bar stays quiet next to the numbers around it. The two bounds print below in
 * mono.
 *
 * The screener uses the `sm` size in each table row for the 52-week range, and
 * the `md` size in the company preview. A value outside the range sits at the
 * nearest end of the track.
 */
const meta: Meta<typeof RangeBar> = {
	title: "Components/RangeBar",
	component: RangeBar,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-40">
				<Story />
			</div>
		),
	],
	argTypes: {
		value: {
			control: { type: "number" },
			description: "The number to place on the track.",
		},
		low: {
			control: { type: "number" },
			description: "The number at the left end of the track.",
		},
		high: {
			control: { type: "number" },
			description: "The number at the right end of the track.",
		},
		size: {
			control: "inline-radio",
			options: RANGE_BAR_SIZES,
			description: "`sm` for a table row or a card, `md` for a detail view.",
		},
		formatBound: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	args: {
		value: 172.5,
		low: 163.08,
		high: 199.62,
		size: "sm",
		"aria-label": "52-week range",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A price near the low end of its range, driven from the Controls panel. */
export const Playground: Story = {};

/** A price in the middle of its range. */
export const Middle: Story = {
	args: { value: 181.35 },
};

/** A price at the high end of its range. */
export const AtHigh: Story = {
	args: { value: 199.62 },
};

/**
 * A price below the recorded low. The marker stops at the left end of the
 * track, and the hidden meter reports the low as its value.
 */
export const Clamped: Story = {
	args: { value: 150 },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const meter = canvas.getByRole("meter", { name: "52-week range" });

		const expectedResult = {
			value: 163.08,
			markerLeft: "0%",
		};

		const marker = canvasElement.querySelector<HTMLElement>(
			'[data-slot="range-bar-marker"]',
		);
		const result = {
			value: (meter as HTMLMeterElement).value,
			markerLeft: marker?.style.left,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * The `md` size for a detail view. The marker and the bound labels grow a
 * step, and a custom `formatBound` adds the currency sign.
 */
export const Medium: Story = {
	args: {
		size: "md",
		value: 9.5,
		low: 7.84,
		high: 17.32,
		formatBound: (bound: number) => `$${bound.toFixed(2)}`,
	},
	decorators: [
		(Story) => (
			<div className="w-72">
				<Story />
			</div>
		),
	],
};
