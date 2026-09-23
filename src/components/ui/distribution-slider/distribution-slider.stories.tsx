import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { readSliderCover } from "../../../../.storybook/utils/sliderCover";

import { DistributionSlider, type SliderRange } from ".";

/** P/E ratios of the screener's sample universe. Two banks report none. */
const PE_RATIOS = [
	28.4,
	35.2,
	11.2,
	14.1,
	16.2,
	33.8,
	7.8,
	9.1,
	7.2,
	7.9,
	7.1,
	19.4,
	null,
];

/** Dividend yields of the same universe, in percent. */
const DIVIDEND_YIELDS = [
	0.5, 0.7, 2.3, 3.7, 3.1, 1.3, 7.2, 2.8, 3.3, 6.2, 5.8, 2.9,
];

/**
 * A `DistributionSlider` draws a small histogram of a metric above a range
 * slider. The reader sees how the universe spreads while choosing a bound.
 * The readout beside the label states the bound in words, or `Any` when both
 * thumbs rest at the ends.
 *
 * While the slider narrows the range, only the bars wholly inside it take the
 * `chart-3` accent. The rest stay in a quiet tint of `muted-foreground`, and
 * the slider track and thumbs stay neutral. A bar that the range only partly
 * covers stays quiet, so the accent never runs past a thumb. It can stop up to
 * one bar short of a thumb. This histogram is the one accent on the screener
 * page.
 *
 * The component is controlled. Each story below keeps its range in state.
 */
const meta: Meta<typeof DistributionSlider> = {
	title: "Components/DistributionSlider",
	component: DistributionSlider,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		label: { control: "text", description: "Names the metric." },
		min: { control: { type: "number" }, description: "Left end of the track." },
		max: {
			control: { type: "number" },
			description: "Right end of the track.",
		},
		step: {
			control: { type: "number" },
			description: "Distance between the numbers a thumb lands on.",
		},
		bounds: {
			control: "inline-radio",
			options: ["both", "upper", "lower"],
			description: "Which bounds the reader sets, and so how many thumbs.",
		},
		binCount: {
			control: { type: "number", min: 4, max: 40, step: 1 },
			description: "How many histogram bars to draw.",
		},
		values: { control: { disable: true } },
		value: { control: { disable: true } },
		onValueChange: { control: { disable: true } },
		formatValue: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	args: {
		label: "P/E",
		values: PE_RATIOS,
		min: 0,
		max: 40,
		step: 0.5,
		binCount: 18,
		value: [0, 40],
	},
	render: function Render(args) {
		const [range, setRange] = useState<SliderRange>(args.value);
		return (
			<div className="w-72">
				<DistributionSlider {...args} value={range} onValueChange={setRange} />
			</div>
		);
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both thumbs rest at the ends, so the slider sets no bound. The bars stay
 * quiet and the readout says `Any`.
 */
export const Playground: Story = {};

/** An upper bound, as in "P/E at most 20". The bars up to 20 take the accent. */
export const UpperBound: Story = {
	args: { value: [0, 20] },
};

/**
 * A lower bound, as in "dividend yield at least 2%". With `bounds="lower"`
 * the slider draws one thumb, because an upper bound on a yield means little.
 * The track fills from the thumb to the right end, the side the filter keeps.
 */
export const LowerBound: Story = {
	args: {
		bounds: "lower",
		label: "Dividend yield",
		values: DIVIDEND_YIELDS,
		min: 0,
		max: 8,
		step: 0.1,
		value: [2, 8],
		formatValue: (value: number) => `${value.toFixed(1)}%`,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const thumb = canvas.getByRole("slider", {
			name: "Dividend yield minimum",
		});

		const expectedResult = {
			readout: "≥ 2.1%",
			fill: "end",
		};

		thumb.focus();
		await userEvent.keyboard("{ArrowRight}");
		// Deviation from TESTING.md §2.2: the filled side of the track is purely
		// visual, so no accessible query reaches it. This reads the styling hook
		// the fill depends on. It does not see the painted color, which the
		// visual review covers.
		const track = canvasElement.querySelector('[data-slot="slider-track"]');
		const result = {
			readout: canvas.getByRole("status").textContent,
			fill: track ? track.getAttribute("data-fill") : "track missing",
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * A lower bound in the dark theme. The side below the thumb is covered with
 * the `input` fill as an opaque layer, since the dark `--input` is translucent
 * and would let the filled track show through.
 */
export const LowerBoundDark: Story = {
	...LowerBound,
	globals: { theme: "dark" },
	play: async ({ canvasElement }) => {
		const expectedResult = { alpha: 255, tint: true };

		// Deviation from TESTING.md §2.2: the rejected side is purely visual, so
		// no accessible query reaches it. The helper reads its painted layers.
		const result = readSliderCover(canvasElement);

		await expect(result).toEqual(expectedResult);
	},
};

/** Both thumbs moved, so the readout shows the band between them. */
export const TwoSided: Story = {
	args: { value: [5, 15] },
};

/**
 * The upper thumb moves down one step with the arrow key, and the readout
 * turns from `Any` into an upper bound.
 */
export const KeyboardMovesUpperThumb: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const upperThumb = canvas.getByRole("slider", { name: "P/E maximum" });

		const expectedResult = "≤ 39.5";

		upperThumb.focus();
		await userEvent.keyboard("{ArrowLeft}");
		const result = canvas.getByRole("status").textContent;

		await expect(result).toBe(expectedResult);
	},
};

/**
 * The upper thumb at 19 on a track of four bars. The bar from 10 to 20 is only
 * partly inside the range, so it stays quiet. The accent ends at 10, short of
 * the thumb.
 */
export const AccentStaysInsideTheRange: Story = {
	args: { value: [0, 19], binCount: 4 },
	play: async ({ canvasElement }) => {
		const expectedResult = ["true", null, null, null];

		// Deviation from TESTING.md §9: the accent is a color, and no role-based
		// query reaches a color, so the bars are read by their data attributes.
		const result = Array.from(
			canvasElement.querySelectorAll('[data-slot="distribution-slider-bar"]'),
			(bar) => bar.getAttribute("data-selected"),
		);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * A range from 19 to 21, narrower than one bar. No bar lies wholly inside it,
 * so no bar takes the accent. The label and the readout still show the bound.
 */
export const NarrowRange: Story = {
	args: { value: [19, 21] },
	play: async ({ canvasElement }) => {
		const expectedResult = { bars: 18, accented: 0 };

		// Deviation from TESTING.md §9: the accent is a color, so the bars are
		// read by their data attributes. The bar count proves they rendered.
		const bars = canvasElement.querySelectorAll(
			'[data-slot="distribution-slider-bar"]',
		);
		const result = {
			bars: bars.length,
			accented: Array.from(bars).filter((bar) =>
				bar.hasAttribute("data-selected"),
			).length,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * A long-tailed universe: 200 companies near a P/E of 12 and one at 35. The
 * lone company's bar stays visible, taller than an empty bin's mark.
 */
export const LongTail: Story = {
	args: {
		values: [...Array.from({ length: 200 }, () => 12), 35],
		value: [0, 40],
	},
};

/**
 * A one-sided slider with `bounds="upper"`. The single thumb moves down one
 * step with the arrow key, and the readout states the upper bound.
 */
export const KeyboardMovesSingleThumb: Story = {
	args: {
		label: "P/FCF",
		bounds: "upper",
		max: 45,
		value: [0, 45],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const thumb = canvas.getByRole("slider", { name: "P/FCF maximum" });

		const expectedResult = "≤ 44.5";

		thumb.focus();
		await userEvent.keyboard("{ArrowLeft}");
		const result = canvas.getByRole("status").textContent;

		await expect(result).toBe(expectedResult);
	},
};
