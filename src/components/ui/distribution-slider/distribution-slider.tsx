import { useId, useMemo } from "react";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { Slider } from "../slider";

/** A selected range, as the two thumb positions `[lower, upper]`. */
type SliderRange = readonly [number, number];

interface DistributionSliderProps
	extends Omit<React.ComponentProps<"div">, "onChange" | "children"> {
	/** Names the metric, for example "P/E". The thumbs read "P/E minimum" and "P/E maximum". */
	label: string;
	/**
	 * The metric across the universe. `null` and non-finite entries are skipped.
	 * Keep the array referentially stable, because the bins are memoized on it.
	 */
	values: readonly (number | null)[];
	/** The number at the left end of the track. */
	min: number;
	/** The number at the right end of the track. */
	max: number;
	/** The distance between the numbers a thumb lands on. Defaults to 1. */
	step?: number;
	/** The selected range. A thumb at its end of the track means "no bound". */
	value: SliderRange;
	/** Called with the new range while a thumb moves. */
	onValueChange: (value: SliderRange) => void;
	/** Formats one number in the readout. Defaults to one decimal. */
	formatValue?: (value: number) => string;
	/** How many histogram bars to draw. Defaults to 18. */
	binCount?: number;
	/**
	 * Which bounds the reader sets. `both` draws two thumbs. `upper` and `lower`
	 * draw one thumb and keep the other end of `value` fixed at `min` or `max`.
	 * Defaults to `both`.
	 */
	bounds?: "both" | "upper" | "lower";
}

/**
 * A range slider with a small histogram of the metric drawn above its track.
 * The reader sees how the universe spreads while choosing a bound, so a
 * threshold fits the data instead of a guess. A readout next to the label
 * states the bound in words, such as `≤ 20.0`, or `Any` when both thumbs rest
 * at the ends.
 *
 * While the slider narrows the range, the bars that lie wholly inside it take
 * the `chart-3` accent. The track and thumbs stay in neutral ink, so the
 * histogram carries the only color. This is the one accent on the screener page
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
	bounds = "both",
	className,
	...props
}: DistributionSliderProps) {
	const labelId = useId();
	const bins = useMemo(
		() => binValues(values, min, max, binCount),
		[values, min, max, binCount],
	);
	const tallest = bins.reduce((highest, count) => Math.max(highest, count), 1);
	const [lower, upper] = value;
	const isActive = lower > min || upper < max;
	const selected = selectBins(bins.length, value, min, max);
	const readout = describeRange(value, min, max, formatValue);

	return (
		<div
			data-slot="distribution-slider"
			className={cn("flex flex-col gap-1.5", className)}
			{...props}
		>
			<div className="flex min-w-0 items-baseline justify-between gap-2">
				<span
					id={labelId}
					className={cn(
						"text-lg",
						isActive ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{label}
				</span>
				{/* The thumbs already announce their value, so the readout stays quiet. */}
				<output
					aria-labelledby={labelId}
					aria-live="off"
					className={cn(
						"truncate font-monospace text-base",
						isActive ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{readout}
				</output>
			</div>
			<div className="flex h-6 items-end gap-px" aria-hidden="true">
				{bins.map((count, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: a bin is identified by its position on the axis
						key={index}
						data-slot="distribution-slider-bar"
						data-selected={selected[index] || undefined}
						className={cn(
							"flex-1 rounded-t-[1px] transition-colors",
							selected[index] ? "bg-chart-3" : "bg-muted-foreground/25",
						)}
						style={{
							// A bar with any company stays at least 2 px, taller than
							// the 1 px mark of an empty bin.
							height:
								count === 0 ? "1px" : `max(2px, ${(count / tallest) * 100}%)`,
						}}
					/>
				))}
			</div>
			<Slider
				aria-labelledby={labelId}
				getThumbLabel={(index) => `${label} ${thumbName(bounds, index)}`}
				fill={bounds === "lower" ? "end" : "start"}
				// Neutral ink: the filled side of the track takes `foreground` while
				// the slider narrows the range, and nothing is filled at rest. The
				// selectors follow `fill`, so a lower bound fills toward the end.
				className={cn(
					"py-1 [&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:shadow-none",
					isActive
						? "[&_[data-slot=slider-thumb]]:border-foreground [&_[data-slot=slider-track][data-fill=start]_[data-slot=slider-indicator]]:bg-foreground [&_[data-slot=slider-track][data-fill=end]]:bg-foreground [&_[data-slot=slider-track][data-fill=end]_[data-slot=slider-indicator]]:bg-input"
						: "[&_[data-slot=slider-thumb]]:border-muted-foreground [&_[data-slot=slider-track][data-fill=start]]:bg-input [&_[data-slot=slider-track][data-fill=end]]:bg-input [&_[data-slot=slider-indicator]]:bg-transparent",
				)}
				min={min}
				max={max}
				step={step}
				value={
					bounds === "upper"
						? upper
						: bounds === "lower"
							? lower
							: [lower, upper]
				}
				onValueChange={(next) => {
					if (typeof next === "number") {
						onValueChange(bounds === "lower" ? [next, max] : [min, next]);
					} else if (next.length === 2) {
						onValueChange([next[0], next[1]]);
					}
				}}
			/>
		</div>
	);
}

/**
 * Counts `values` into `count` equal-width bins between `min` and `max`.
 * `null` and non-finite entries are skipped. A value outside the range lands
 * in the nearest edge bin, so an outlier still appears in the histogram. A
 * `count` that is not a positive integer gives no bins.
 */
function binValues(
	values: readonly (number | null)[],
	min: number,
	max: number,
	count: number,
): number[] {
	const safeCount = Number.isInteger(count) && count > 0 ? count : 0;
	const bins = new Array<number>(safeCount).fill(0);
	if (safeCount === 0 || !(max > min)) return bins;
	for (const value of values) {
		if (value === null || !Number.isFinite(value)) continue;
		const index = Math.floor(((value - min) / (max - min)) * safeCount);
		bins[Math.min(safeCount - 1, Math.max(0, index))] += 1;
	}
	return bins;
}

/**
 * Marks which of `binCount` equal bins lie wholly inside the selected range.
 * A bin that only overlaps the range stays unmarked, so the accent never runs
 * past a thumb. A range narrower than one bin therefore marks nothing, which
 * reads as "no bar is fully inside" and is the honest answer. A range that
 * covers the whole track marks nothing, because it sets no bound.
 */
function selectBins(
	binCount: number,
	[lower, upper]: SliderRange,
	min: number,
	max: number,
): boolean[] {
	// A range that covers the whole track sets no bound, so no bar is marked.
	if (lower <= min && upper >= max)
		return new Array<boolean>(binCount).fill(false);
	const width = (max - min) / binCount;
	// Bin edges are floating-point sums, so compare with a small tolerance.
	// With 24 bins over 0 to 40, the edge at 20 sums to a hair above 20.
	const tolerance = width * 1e-9;
	return Array.from({ length: binCount }, (_unused, index) => {
		const start = min + index * width;
		return start >= lower - tolerance && start + width <= upper + tolerance;
	});
}

/** Whether the thumb at `index` sets the minimum or the maximum. */
function thumbName(
	bounds: NonNullable<DistributionSliderProps["bounds"]>,
	index: number,
): "minimum" | "maximum" {
	if (bounds === "upper") return "maximum";
	if (bounds === "lower") return "minimum";
	return index === 0 ? "minimum" : "maximum";
}

/**
 * Words a selected range for the readout. A thumb resting at its end of the
 * track sets no bound, so the result is `≥ lower`, `≤ upper`, `lower – upper`,
 * or `Any`.
 */
function describeRange(
	[lower, upper]: SliderRange,
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
	type SliderRange,
	binValues,
	describeRange,
	selectBins,
};
