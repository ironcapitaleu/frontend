import type * as React from "react";
import { useId } from "react";

import type { Series } from "@/lib/company/types";
import { cn } from "@/lib/utils";
import { MISSING, MISSING_INK } from "../screener/format";
import { SourceTrigger } from "./SourceCard";

/** The chart draws at most this many years, the latest ones. */
const MAX_YEARS = 10;

/**
 * The least height of a known non-zero bar, in percent of the plot. About one
 * pixel of the 64 px plot, so a small value never reads as a missing year.
 */
const MIN_HEIGHT = 2;

/** Props for {@link MiniBarChart}. */
interface MiniBarChartProps
	extends Omit<React.ComponentProps<"figure">, "children"> {
	/** One point for each fiscal year, oldest first. */
	series: Series;
	/** Writes a known value in the unit of the series, such as `$212.0B`. */
	formatValue: (value: number) => string;
}

/** How one year draws. */
interface MiniBar {
	/** A React key built from the index and the year, since a year can repeat. */
	readonly key: string;
	/** The year as the page prints it, such as `FY2026`. */
	readonly year: string;
	/** `null` when the point is missing or its value is not a finite number. */
	readonly value: number | null;
	/** The top edge of the bar, from 0 to 100 percent of the plot height. */
	readonly top: number;
	/** The height of the bar, from 0 to 100 percent. `0` for a missing year. */
	readonly height: number;
}

/** The bars of a {@link MiniBarChart} and where its zero line sits. */
interface MiniBars {
	readonly bars: readonly MiniBar[];
	/** The zero line, from 0 (top) to 100 (bottom) percent of the plot height. */
	readonly zero: number;
}

/**
 * Returns how the last ten years of `series` draw. One scale spans the
 * lowest and the highest value and always holds zero, so a negative value
 * draws below the zero line. A missing or non-finite point gets no bar.
 */
function miniBars(series: Series): MiniBars {
	const years = series.periods.slice(-MAX_YEARS);
	const offset = series.periods.length - years.length;
	const values = years.map((_, index) => {
		const value = series.points[offset + index]?.value;
		return typeof value === "number" && Number.isFinite(value) ? value : null;
	});
	const known = values.filter((value) => value !== null);
	const high = Math.max(0, ...known);
	const low = Math.min(0, ...known);
	const span = high - low;
	const zero = span === 0 ? 100 : (high / span) * 100;
	const bars = years.map((period, index) => {
		const value = values[index] ?? null;
		const room = value !== null && value > 0 ? zero : 100 - zero;
		const height =
			value === null || value === 0 || span === 0
				? 0
				: Math.min(Math.max((Math.abs(value) / span) * 100, MIN_HEIGHT), room);
		const year = `FY${period.fiscalYear}`;
		return {
			key: `${index}-${year}`,
			year,
			value,
			top: value !== null && value > 0 ? zero - height : zero,
			height,
		};
	});
	return { bars, zero };
}

/**
 * A small bar chart of one series, one bar per fiscal year, with the latest
 * figure above the bars. The latest figure and each bar open the source card
 * of their year (DESIGN.md §8: a point of a chart shows its own sources).
 * Overview's "Ten Years at a Glance" draws four of them.
 *
 * It draws the years the series has, up to the last ten. A negative value
 * draws below the zero line. A missing or non-finite point leaves a gap with
 * a small dot on the zero line, so it never reads as zero. The latest year
 * draws in a stronger fill. The bars form a list, one item per year. The
 * name of each item is its year and value, with a dash for a missing year.
 * A known year's bar is a button, so hover, focus, a click or a tap opens its
 * card. A missing year has no source, so it is no button. There are no axes. The chart fills the width of
 * its card, so the phone layout of two charts to a row comes from the tab.
 */
function MiniBarChart({
	series,
	formatValue,
	className,
	...props
}: MiniBarChartProps) {
	const captionId = useId();
	const { bars, zero } = miniBars(series);
	const offset = series.periods.length - bars.length;
	const latest = bars.at(-1);
	const latestValue = latest?.value ?? null;
	const latestClaim = series.points[series.periods.length - 1] ?? null;
	const format = (value: number | null) =>
		value === null ? MISSING : formatValue(value);

	return (
		<figure
			data-slot="mini-bar-chart"
			aria-labelledby={captionId}
			className={cn("flex min-w-0 flex-col gap-2", className)}
			{...props}
		>
			<figcaption id={captionId} className="flex flex-col gap-0.5">
				<span className="text-muted-foreground text-sm">{series.label}</span>{" "}
				<span
					className={cn(
						"font-monospace text-lg",
						latestValue === null && MISSING_INK,
					)}
				>
					{latestValue === null || latestClaim === null ? (
						MISSING
					) : (
						<SourceTrigger claim={latestClaim}>
							{format(latestValue)}
						</SourceTrigger>
					)}
				</span>
			</figcaption>
			<div className="relative h-16">
				<ul className="flex h-full gap-0.5">
					{bars.map((bar, index) => {
						const claim = series.points[offset + index] ?? null;
						const mark =
							bar.value === null ? (
								<span
									data-slot="mini-bar-chart-gap"
									className="absolute left-1/2 size-1.5 -translate-1/2 rounded-full bg-muted-foreground/60"
									style={{ top: `${zero}%` }}
								/>
							) : (
								<span
									data-slot="mini-bar-chart-bar"
									className={cn(
										"absolute inset-x-0 mx-auto block max-w-6",
										bar.value > 0 ? "rounded-t-sm" : "rounded-b-sm",
										index === bars.length - 1 ? "bg-chart-3" : "bg-chart-1",
									)}
									style={{ top: `${bar.top}%`, height: `${bar.height}%` }}
								/>
							);
						const text = (
							<span className="sr-only">{`${bar.year}: ${format(bar.value)}`}</span>
						);
						return (
							<li key={bar.key} className="relative flex-1">
								{bar.value === null || claim === null ? (
									<>
										{mark}
										{text}
									</>
								) : (
									<SourceTrigger
										claim={claim}
										className="absolute inset-0 block"
									>
										{mark}
										{text}
									</SourceTrigger>
								)}
							</li>
						);
					})}
				</ul>
				<div
					className="pointer-events-none absolute inset-x-0 h-px bg-muted-foreground/50"
					style={{ top: `${zero}%` }}
					aria-hidden="true"
				/>
			</div>
			<div
				className="flex justify-between font-monospace text-muted-foreground text-xs"
				aria-hidden="true"
			>
				<span>{bars[0]?.year}</span>
				<span>{bars.length > 1 ? latest?.year : null}</span>
			</div>
		</figure>
	);
}

export {
	type MiniBar,
	MiniBarChart,
	type MiniBarChartProps,
	type MiniBars,
	miniBars,
};
