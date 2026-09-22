import type * as React from "react";

import { cn } from "@/lib/utils";
import { type Stock, median } from "@/pages/public/StockScreener.logic";

import {
	CHANGE_TONE_CLASS,
	type ChangeTone,
	changeTone,
	formatNumber,
	formatPercent,
	formatSignedPercent,
} from "./format";

/** One cell of the summary strip. */
export interface SummaryCell {
	readonly label: string;
	/** The median of the result set, formatted. */
	readonly value: string;
	/** The median of the whole universe, formatted, for comparison. */
	readonly universe: string;
	readonly tone: ChangeTone;
}

interface ScreenerSummaryProps
	extends Omit<React.ComponentProps<"dl">, "children"> {
	/** The stocks that pass the current filters. */
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
	return (
		<dl
			aria-label="Medians of the results"
			className={cn(
				"grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4",
				className,
			)}
			{...props}
		>
			{buildSummaryCells(matched, universe).map((cell) => (
				<div key={cell.label} className="flex flex-col gap-1 bg-card px-4 py-3">
					<dt className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
						{cell.label}
					</dt>
					<dd
						className={cn(
							"font-monospace text-3xl font-medium",
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
	);
}

/**
 * The four summary cells for a result set, compared with the universe. Pure,
 * so the medians test apart from the render.
 */
export function buildSummaryCells(
	matched: readonly Stock[],
	universe: readonly Stock[],
): SummaryCell[] {
	const medianOf = (
		stocks: readonly Stock[],
		pick: (stock: Stock) => number | null,
	) => median(stocks.map(pick));
	const change = medianOf(matched, (stock) => stock.changePercent1M);

	return [
		{
			label: "Median P/E",
			value: formatNumber(medianOf(matched, (stock) => stock.peRatio)),
			universe: formatNumber(medianOf(universe, (stock) => stock.peRatio)),
			tone: "neutral",
		},
		{
			label: "Median P/FCF",
			value: formatNumber(medianOf(matched, (stock) => stock.priceToFcf)),
			universe: formatNumber(medianOf(universe, (stock) => stock.priceToFcf)),
			tone: "neutral",
		},
		{
			label: "Median dividend",
			value: formatPercent(medianOf(matched, (stock) => stock.dividendYield)),
			universe: formatPercent(
				medianOf(universe, (stock) => stock.dividendYield),
			),
			tone: "neutral",
		},
		{
			label: "Median 1M",
			value: formatSignedPercent(change),
			universe: formatSignedPercent(
				medianOf(universe, (stock) => stock.changePercent1M),
			),
			tone: changeTone(change),
		},
	];
}

export { ScreenerSummary, type ScreenerSummaryProps };
