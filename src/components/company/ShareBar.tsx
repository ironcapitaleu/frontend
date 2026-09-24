import type * as React from "react";

import type { Figure } from "@/lib/company/types";
import { cn } from "@/lib/utils";
import { formatPercent, MISSING } from "../screener/format";

/** One part of a {@link ShareBar}: a label and its share as a `percent` claim. */
interface SharePart {
	readonly label: string;
	/** A fraction, so `0.15` is 15%. `null` for a missing share. */
	readonly share: Figure;
}

/** Props for {@link ShareBar}. */
interface ShareBarProps
	extends Omit<React.ComponentProps<"figure">, "aria-label"> {
	/** Names the whole, such as "Revenue by segment". */
	"aria-label": string;
	/** At most five parts. A sixth part and later reuse `chart-5`. */
	parts: readonly SharePart[];
}

/** The fill of each part, in order (DESIGN.md §8). */
const FILLS = [
	"bg-chart-1",
	"bg-chart-2",
	"bg-chart-3",
	"bg-chart-4",
	"bg-chart-5",
] as const;

/** How one part draws: its share, its width on the bar, and its fill. */
interface ShareSegment {
	readonly label: string;
	/** The share as a fraction, or `null` when missing or not finite. */
	readonly share: number | null;
	/** The width on the bar from 0 to 100, or `null` for no segment. */
	readonly width: number | null;
	readonly fill: (typeof FILLS)[number];
}

/**
 * Returns how each part draws. A missing share gets no segment. Shares that
 * sum to less than 1 leave the rest of the bar empty. Shares that sum to more
 * than 1 shrink in step so the bar never overflows, and their labels still
 * print the true shares.
 */
function shareSegments(parts: readonly SharePart[]): ShareSegment[] {
	const shares = parts.map(({ share }) => {
		const value = share?.value;
		return typeof value === "number" && Number.isFinite(value) && value >= 0
			? value
			: null;
	});
	const total = shares.reduce<number>((sum, share) => sum + (share ?? 0), 0);
	const scale = total > 1 ? 1 / total : 1;
	return parts.map((part, index) => {
		const share = shares[index] ?? null;
		return {
			label: part.label,
			share,
			width: share === null ? null : share * scale * 100,
			fill: FILLS[Math.min(index, FILLS.length - 1)] ?? "bg-chart-5",
		};
	});
}

/**
 * One horizontal bar that splits a whole into parts, with a label and a
 * percentage for each part below it. The company page draws the segment and
 * region splits of revenue and the ownership split with it (DESIGN.md §8
 * "Overview"). It takes the parts as props and computes nothing from the
 * company sections.
 *
 * The bar is hidden from assistive technology. The list of labels and
 * percentages is its text alternative. A missing share prints a dimmed `—`
 * and draws no segment, so it never reads as 0%. On a phone the list stacks
 * in one column.
 */
function ShareBar({ parts, className, ...props }: ShareBarProps) {
	const segments = shareSegments(parts);

	return (
		<figure
			data-slot="share-bar"
			className={cn("flex min-w-0 flex-col gap-3", className)}
			{...props}
		>
			<div
				className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm bg-muted"
				aria-hidden="true"
			>
				{segments.map((segment) =>
					segment.width ? (
						<div
							key={segment.label}
							data-slot="share-bar-segment"
							className={cn("min-w-0 shrink", segment.fill)}
							style={{ flexBasis: `${segment.width}%` }}
						/>
					) : null,
				)}
			</div>
			<ul className="flex flex-col gap-1 text-sm md:flex-row md:flex-wrap md:gap-x-5">
				{segments.map((segment) => (
					<li key={segment.label} className="flex items-center gap-2">
						<span
							className={cn("size-2.5 rounded-xs", segment.fill)}
							aria-hidden="true"
						/>
						<span className="text-muted-foreground">{segment.label}</span>
						<span
							className={cn(
								"font-monospace",
								segment.share === null && "text-muted-foreground/60",
							)}
						>
							{segment.share === null
								? MISSING
								: formatPercent(segment.share * 100)}
						</span>
					</li>
				))}
			</ul>
		</figure>
	);
}

export {
	ShareBar,
	type ShareBarProps,
	type SharePart,
	type ShareSegment,
	shareSegments,
};
