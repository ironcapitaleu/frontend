import { useId } from "react";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { Slider } from "../slider";

/** A selected range, as the two thumb positions `[lower, upper]`. */
type Range = readonly [number, number];

interface DistributionSliderProps
	extends Omit<React.ComponentProps<"div">, "onChange" | "children"> {
	/** Names the metric, for example "P/E". It also labels both thumbs. */
	label: string;
	/** The metric across the universe. `null` entries are skipped. */
	values: readonly (number | null)[];
	/** The number at the left end of the track. */
	min: number;
	/** The number at the right end of the track. */
	max: number;
	/** The distance between the numbers a thumb lands on. Defaults to 1. */
	step?: number;
	/** The selected range. A thumb at its end of the track means "no bound". */
	value: Range;
	/** Called with the new range while a thumb moves. */
	onValueChange: (value: Range) => void;
	/** Formats one number in the readout. Defaults to one decimal. */
	formatValue?: (value: number) => string;
	/** How many histogram bars to draw. Defaults to 18. */
	binCount?: number;
}

/**
 * A range slider with a small histogram of the metric drawn above its track.
 * The reader sees how the universe spreads while choosing a bound, so a
 * threshold fits the data instead of a guess. A readout next to the label
 * states the bound in words, such as `≤ 20.0`, or `Any` when both thumbs rest
 * at the ends.
 *
 * The bars inside the selected range take the `chart-3` accent only while the
 * slider narrows the range. This is the one accent on the screener page
 * (DESIGN.md §7). Use a plain `Slider` when no distribution is available.
 */
function DistributionSlider({
	label,
	values,
	min,
	max,
	step = 1,
	value,
	onValueChange,
	formatValue = defaultFormatValue,
	binCount = 18,
	className,
	...props
}: DistributionSliderProps) {
	const labelId = useId();
	const bins = binValues(values, min, max, binCount);
	const tallest = Math.max(1, ...bins);
	const [lower, upper] = value;
	const isActive = lower > min || upper < max;
	const readout = describeRange(value, min, max, formatValue);

	return (
		<div
			data-slot="distribution-slider"
			className={cn("flex flex-col gap-1.5", className)}
			{...props}
		>
			<div className="flex items-baseline justify-between gap-2">
				<span
					id={labelId}
					className={cn(
						"text-lg",
						isActive ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{label}
				</span>
				<output
					aria-labelledby={labelId}
					className={cn(
						"font-monospace text-base",
						isActive ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{readout}
				</output>
			</div>
			<div className="flex h-6 items-end gap-px" aria-hidden="true">
				{bins.map((count, index) => {
					const binCenter = min + ((index + 0.5) * (max - min)) / binCount;
					const isSelected =
						isActive && binCenter >= lower && binCenter <= upper;
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: a bin is identified by its position on the axis
							key={index}
							data-slot="distribution-slider-bar"
							data-selected={isSelected || undefined}
							className={cn(
								"flex-1 rounded-t-[1px] transition-colors",
								isSelected ? "bg-chart-3" : "bg-border",
							)}
							style={{
								height: count === 0 ? "1px" : `${(count / tallest) * 100}%`,
							}}
						/>
					);
				})}
			</div>
			<Slider
				aria-labelledby={labelId}
				className="py-1"
				min={min}
				max={max}
				step={step}
				value={[lower, upper]}
				onValueChange={(next) => {
					if (Array.isArray(next) && next.length === 2) {
						onValueChange([next[0], next[1]]);
					}
				}}
			/>
		</div>
	);
}

/**
 * Counts `values` into `count` equal-width bins between `min` and `max`.
 * `null` entries are skipped. A value outside the range lands in the nearest
 * edge bin, so an outlier still shows up in the histogram.
 */
function binValues(
	values: readonly (number | null)[],
	min: number,
	max: number,
	count: number,
): number[] {
	const bins = new Array<number>(count).fill(0);
	if (count <= 0 || !(max > min)) return bins;
	for (const value of values) {
		if (value === null) continue;
		const index = Math.floor(((value - min) / (max - min)) * count);
		bins[Math.min(count - 1, Math.max(0, index))] += 1;
	}
	return bins;
}

/**
 * Words a selected range for the readout. A thumb resting at its end of the
 * track sets no bound, so the result is `≥ lower`, `≤ upper`, `lower – upper`,
 * or `Any`.
 */
function describeRange(
	[lower, upper]: Range,
	min: number,
	max: number,
	formatValue: (value: number) => string,
): string {
	const hasLower = lower > min;
	const hasUpper = upper < max;
	if (hasLower && hasUpper) {
		return `${formatValue(lower)} – ${formatValue(upper)}`;
	}
	if (hasLower) return `≥ ${formatValue(lower)}`;
	if (hasUpper) return `≤ ${formatValue(upper)}`;
	return "Any";
}

function defaultFormatValue(value: number): string {
	return value.toFixed(1);
}

export {
	DistributionSlider,
	type DistributionSliderProps,
	type Range,
	binValues,
	describeRange,
};
