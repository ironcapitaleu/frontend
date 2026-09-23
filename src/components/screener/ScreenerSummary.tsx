import { useMemo } from "react";
import type * as React from "react";

import { cn } from "@/lib/utils";
import type { Stock } from "./screener.logic";

import { buildSummaryCells } from "./ScreenerSummary.logic";
import { CHANGE_TONE_CLASS } from "./format";

/** Props for {@link ScreenerSummary}. */
interface ScreenerSummaryProps
	extends Omit<React.ComponentProps<"section">, "children"> {
	/** The stocks that pass the current filters, a subset of `universe`. */
	matched: readonly Stock[];
	/** Every stock the screener searches. */
	universe: readonly Stock[];
}

/**
 * A strip of four medians above the results: P/E, P/FCF, dividend yield, and
 * the 1M change. Each cell also prints the universe median, so the reader
 * judges at a glance how cheap or how beaten down the current screen is.
 *
 * The 1M median takes the `positive` or `negative` token. A median without
 * data reads `—`. The strip shows two columns on a phone and four from the
 * `md` breakpoint.
 */
function ScreenerSummary({
	matched,
	universe,
	className,
	...props
}: ScreenerSummaryProps) {
	const cells = useMemo(
		() => buildSummaryCells(matched, universe),
		[matched, universe],
	);

	return (
		<section
			aria-label="Medians of the results"
			className={className}
			{...props}
		>
			{/* The hairlines are a 1 px gap over the border token. They stay even
			    only while the grid is full, so keep the cell count a multiple of
			    four. */}
			<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
				{cells.map((cell) => (
					<div
						key={cell.label}
						className="flex flex-col gap-1 bg-card px-4 py-3"
					>
						<dt className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
							{cell.label}
						</dt>
						<dd
							className={cn(
								"font-monospace text-3xl font-medium",
								// A flat headline median keeps full ink. Dimmed, it would
								// read as missing. Dense rows use the muted neutral tone.
								cell.tone === "neutral"
									? "text-foreground"
									: CHANGE_TONE_CLASS[cell.tone],
							)}
						>
							{cell.value}
						</dd>
						<dd className="text-sm text-muted-foreground">
							Universe <span className="font-monospace">{cell.universe}</span>
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

export { ScreenerSummary, type ScreenerSummaryProps };
