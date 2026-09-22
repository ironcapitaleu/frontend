import type * as React from "react";

import { cn } from "@/lib/utils";

import {
	type RangeBarVariants,
	rangeBarBoundsVariants,
	rangeBarMarkerVariants,
} from "./variants";

interface RangeBarProps
	extends Omit<React.ComponentProps<"div">, "children">,
		RangeBarVariants {
	/** The number to place on the track. A value outside the range sits at the nearest end. */
	value: number;
	/** The number at the left end of the track. */
	low: number;
	/** The number at the right end of the track. */
	high: number;
	/** Formats the two bound labels and the spoken value. Defaults to two decimals. */
	formatBound?: (bound: number) => string;
}

/**
 * A thin track with a marker that shows where a value sits between a low and a
 * high, with both bounds printed below it in mono. The screener uses it for the
 * 52-week price range, so the reader spots a company near its low without
 * reading two extra columns.
 *
 * A hidden native `meter` carries the value for assistive technology, so give
 * the bar an `aria-label` that names the range. Use a `Progress` bar instead when the value is a share of a
 * task that grows toward done.
 */
function RangeBar({
	value,
	low,
	high,
	formatBound = defaultFormatBound,
	size,
	className,
	"aria-label": ariaLabel,
	...props
}: RangeBarProps) {
	const position = rangeBarPosition(value, low, high);

	return (
		<div
			data-slot="range-bar"
			className={cn("flex min-w-0 flex-col gap-1", className)}
			{...props}
		>
			<meter
				className="sr-only"
				min={low}
				max={high}
				value={Math.min(Math.max(value, low), high)}
				aria-label={ariaLabel}
				aria-valuetext={`${formatBound(value)}, between ${formatBound(low)} and ${formatBound(high)}`}
			/>
			<div className="relative h-3" aria-hidden="true">
				<div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
				<div
					data-slot="range-bar-marker"
					className={rangeBarMarkerVariants({ size })}
					style={{ left: `${position}%` }}
				/>
			</div>
			<div className={rangeBarBoundsVariants({ size })} aria-hidden="true">
				<span>{formatBound(low)}</span>
				<span>{formatBound(high)}</span>
			</div>
		</div>
	);
}

/**
 * The position of `value` on the track, as a percentage from the left end.
 * Clamps to 0 and 100, and returns 50 when the range is empty or inverted, so
 * the marker never leaves the track.
 */
function rangeBarPosition(value: number, low: number, high: number): number {
	if (!(high > low)) return 50;
	const ratio = ((value - low) / (high - low)) * 100;
	return Math.min(100, Math.max(0, ratio));
}

function defaultFormatBound(bound: number): string {
	return bound.toFixed(2);
}

export { RangeBar, type RangeBarProps, rangeBarPosition };
