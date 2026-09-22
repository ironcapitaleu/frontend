import type * as React from "react";

import { cn } from "@/lib/utils";

import {
	type RangeBarVariants,
	rangeBarBoundsVariants,
	rangeBarMarkerVariants,
} from "./variants";

interface RangeBarProps
	extends Omit<React.ComponentProps<"div">, "children" | "aria-label">,
		RangeBarVariants {
	/** Names the range for assistive technology, for example "52-week range". */
	"aria-label": string;
	/**
	 * The number to place on the track. A value outside the range sits at the
	 * nearest end. A value that is not a finite number (`NaN` for a missing
	 * price) draws no marker.
	 */
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
 * high, with both bounds printed below it in mono. It is built for the
 * screener's 52-week price range, so the reader spots a company near its low
 * without reading two extra columns.
 *
 * A hidden native `meter` carries the value for assistive technology, and the
 * required `aria-label` names it. The spoken text states the true value, also
 * when the marker is held at an end of the track. Missing data (a value that is
 * not finite, or an empty or inverted range) draws no marker and reads as "no
 * data", never as a position. Use a `Progress` bar instead when the value is a
 * share of a task that grows toward done.
 */
function RangeBar({
	value,
	low,
	high,
	formatBound = defaultFormatBound,
	size,
	className,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
	...props
}: RangeBarProps) {
	const position = rangeBarPosition(value, low, high);

	return (
		<div
			data-slot="range-bar"
			className={cn("flex min-w-0 flex-col gap-1", className)}
			{...props}
		>
			{position === null ? (
				<span className="sr-only">{`${ariaLabel}: no data`}</span>
			) : (
				<meter
					className="sr-only"
					min={low}
					max={high}
					value={Math.min(Math.max(value, low), high)}
					aria-label={ariaLabel}
					aria-labelledby={ariaLabelledBy}
					aria-valuetext={`${formatBound(value)}, between ${formatBound(low)} and ${formatBound(high)}`}
				/>
			)}
			<div className="relative h-3" aria-hidden="true">
				<div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
				{position === null ? null : (
					<div
						data-slot="range-bar-marker"
						className={rangeBarMarkerVariants({ size })}
						style={{ left: `${position}%` }}
					/>
				)}
			</div>
			<div className={rangeBarBoundsVariants({ size })} aria-hidden="true">
				<span>{formatBound(low)}</span>
				<span>{formatBound(high)}</span>
			</div>
		</div>
	);
}

/**
 * The position of `value` on the track, as a percentage from the left end,
 * clamped to 0 and 100 so the marker never leaves the track. Returns `null`
 * when there is nothing true to show: a value that is not finite, or an empty,
 * inverted, or non-finite range. The bar then draws no marker.
 */
function rangeBarPosition(
	value: number,
	low: number,
	high: number,
): number | null {
	if (!Number.isFinite(value) || !Number.isFinite(low)) return null;
	if (!Number.isFinite(high) || !(high > low)) return null;
	const ratio = ((value - low) / (high - low)) * 100;
	return Math.min(100, Math.max(0, ratio));
}

function defaultFormatBound(bound: number): string {
	return bound.toFixed(2);
}

export { RangeBar, type RangeBarProps, rangeBarPosition };
