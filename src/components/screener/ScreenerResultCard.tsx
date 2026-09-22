import type * as React from "react";

import { RangeBar } from "@/components/ui/range-bar";
import { cn } from "@/lib/utils";
import type { Stock } from "@/pages/public/StockScreener.logic";

import {
	CHANGE_TONE_CLASS,
	METRICS,
	type MetricField,
	changeTone,
	formatPrice,
	formatSignedPercent,
} from "./format";

interface ScreenerResultCardProps
	extends Omit<React.ComponentProps<"button">, "onSelect" | "children"> {
	stock: Stock;
	/**
	 * The third key figure, usually the column the list is sorted by. P/E and
	 * P/FCF always show, so either of them falls back to the dividend yield.
	 * Defaults to `dividendYield`.
	 */
	highlightField?: MetricField;
	/** Called with the stock's symbol when the reader selects the card. */
	onSelect: (symbol: string) => void;
}

/**
 * One screener result on a phone, in place of a table row. The card shows the
 * ticker and name, the price and its 1M change, three key figures, and the
 * 52-week range. The reader reads a screen without scrolling a wide table
 * sideways.
 *
 * The whole card is one button that opens the company preview. The third key
 * figure follows the sort. Its label turns from muted to `foreground` ink to
 * show that the list is ordered by it. The screener keeps its one accent for
 * the filter histograms (DESIGN.md §7).
 */
function ScreenerResultCard({
	stock,
	highlightField = "dividendYield",
	onSelect,
	className,
	...props
}: ScreenerResultCardProps) {
	const third = cardHighlight(highlightField);
	const figures: { field: MetricField; highlighted: boolean }[] = [
		{ field: "peRatio", highlighted: false },
		{ field: "priceToFcf", highlighted: false },
		{ field: third, highlighted: third === highlightField },
	];

	return (
		<button
			type="button"
			aria-haspopup="dialog"
			onClick={() => onSelect(stock.symbol)}
			className={cn(
				"flex w-full cursor-pointer flex-col gap-3 border-b border-border py-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
				className,
			)}
			{...props}
		>
			<span className="flex w-full items-start justify-between gap-3">
				<span className="flex min-w-0 flex-col gap-0.5">
					<span className="font-monospace text-xl font-medium">
						{stock.symbol}
					</span>
					<span className="truncate text-base text-muted-foreground">
						{stock.name} · {stock.country}
					</span>
				</span>
				<span className="flex shrink-0 flex-col items-end gap-0.5 font-monospace">
					<span className="text-xl">{formatPrice(stock.price)}</span>
					<span
						className={cn(
							"text-base",
							CHANGE_TONE_CLASS[changeTone(stock.changePercent1M)],
						)}
					>
						{formatSignedPercent(stock.changePercent1M)}
					</span>
				</span>
			</span>
			<span className="grid w-full grid-cols-[repeat(3,minmax(0,1fr))_7rem] items-end gap-2">
				{figures.map(({ field, highlighted }) => {
					const value = stock[field];
					return (
						<span key={field} className="flex flex-col gap-0.5">
							<span
								className={cn(
									"text-xs tracking-wider uppercase",
									highlighted
										? "font-medium text-foreground"
										: "text-muted-foreground",
								)}
							>
								{METRICS[field].label}
							</span>
							<span
								className={cn(
									"font-monospace text-lg",
									value === null && "text-muted-foreground/60",
									highlighted && "font-medium",
								)}
							>
								{METRICS[field].format(value)}
							</span>
						</span>
					);
				})}
				<span className="flex flex-col gap-0.5">
					<span className="text-xs tracking-wider text-muted-foreground uppercase">
						52 weeks
					</span>
					<RangeBar
						aria-label={`${stock.symbol} 52-week range`}
						value={stock.price}
						low={stock.weekLow52}
						high={stock.weekHigh52}
					/>
				</span>
			</span>
		</button>
	);
}

/** The third key figure. P/E and P/FCF always show, so they fall back to the dividend. */
function cardHighlight(field: MetricField): MetricField {
	return field === "peRatio" || field === "priceToFcf"
		? "dividendYield"
		: field;
}

export { ScreenerResultCard, type ScreenerResultCardProps, cardHighlight };
