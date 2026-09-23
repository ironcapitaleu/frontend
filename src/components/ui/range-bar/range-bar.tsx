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
	 * nearest end. A missing value (`null`, or a number that is not finite)
	 * draws a dimmed dash in place of the track.
	 */
	value: number | null;
	/** The number at the left end of the track, or `null` when missing. */
	low: number | null;
	/** The number at the right end of the track, or `null` when missing. */
	high: number | null;
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
 * when the marker is held at an end of the track. Missing data (a missing
 * value, or an empty or inverted range) draws a dimmed dash in place of the
 * track and reads as "no data", never as a position. A missing bound prints
 * as a dash (DESIGN.md §7). Use a `Progress` bar instead when the value is a
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
			{position ? (
				<meter
					className="sr-only"
					min={position.low}
					max={position.high}
					value={position.clamped}
					aria-label={ariaLabel}
					aria-labelledby={ariaLabelledBy}
					aria-valuetext={`${formatBound(position.value)}, between ${formatBound(position.low)} and ${formatBound(position.high)}`}
				/>
			) : (
				<span className="sr-only">{`${ariaLabel}: no data`}</span>
			)}
			<div className="relative h-3" aria-hidden="true">
				{position ? (
					<>
						<div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
						<div
							data-slot="range-bar-marker"
							className={rangeBarMarkerVariants({ size })}
							style={{ left: `${position.percent}%` }}
						/>
					</>
				) : (
					<span
						data-slot="range-bar-missing"
						className="absolute inset-0 flex items-center justify-center font-monospace text-sm leading-none text-muted-foreground/60"
					>
						—
					</span>
				)}
			</div>
			<div
				data-slot="range-bar-bounds"
				className={rangeBarBoundsVariants({ size })}
				aria-hidden="true"
			>
				<span>{formatKnownBound(low, formatBound)}</span>
				<span>{formatKnownBound(high, formatBound)}</span>
			</div>
		</div>
	);
}

/** Where a value sits on the track, once the value and the range are known. */
interface RangeBarPosition {
	/** Distance from the left end, from 0 to 100. */
	readonly percent: number;
	/** The value held inside the range, for the meter. */
	readonly clamped: number;
	readonly value: number;
	readonly low: number;
	readonly high: number;
}

/**
 * The position of `value` on the track, clamped so the marker never leaves the
 * track. Returns `null` when there is nothing true to show: a missing or
 * non-finite value, or an empty, inverted, or missing range. The bar then
 * draws a dimmed dash in place of the track.
 */
function rangeBarPosition(
	value: number | null,
	low: number | null,
	high: number | null,
): RangeBarPosition | null {
	if (!isKnown(value) || !isKnown(low) || !isKnown(high)) return null;
	if (!(high > low)) return null;
	const clamped = Math.min(Math.max(value, low), high);
	return {
		percent: ((clamped - low) / (high - low)) * 100,
		clamped,
		value,
		low,
		high,
	};
}

function isKnown(value: number | null): value is number {
	return value !== null && Number.isFinite(value);
}

/** Formats a printed bound, or a dash when the bound is missing. */
function formatKnownBound(
	bound: number | null,
	formatBound: (bound: number) => string,
): string {
	return isKnown(bound) ? formatBound(bound) : "—";
}

function defaultFormatBound(bound: number): string {
	return bound.toFixed(2);
}

export {
	RangeBar,
	type RangeBarPosition,
	type RangeBarProps,
	rangeBarPosition,
};
