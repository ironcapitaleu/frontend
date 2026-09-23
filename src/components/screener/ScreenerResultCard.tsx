import type * as React from "react";

import { RangeBar } from "@/components/ui/range-bar";
import { cn } from "@/lib/utils";
import type { Stock } from "@/pages/public/StockScreener.logic";

import {
	CHANGE_TONE_CLASS,
	METRICS,
	MISSING,
	changeTone,
	formatMetric,
	formatPrice,
	formatSignedPercent,
} from "./format";
import { cardFigures } from "./ScreenerResultCard.logic";

/** Props for {@link ScreenerResultCard}. */
interface ScreenerResultCardProps
	extends Omit<React.ComponentProps<"div">, "onSelect" | "children"> {
	/** The result the card shows. */
	stock: Stock;
	/**
	 * The field the list is sorted by, so a page passes its sort field as is.
	 * A key figure carries the sort cue. A sort on another key figure fills the
	 * third slot, and any other field fills it with the dividend yield. Price
	 * and 1M change carry no cue by design: they lead the card already.
	 * Defaults to `null`, which fills the third slot with the dividend yield
	 * and highlights nothing.
	 */
	highlightField?: keyof Stock | null;
	/** Whether this card's preview is the one open. */
	selected?: boolean;
	/** Called with the stock's symbol when the reader selects the card. */
	onSelect: (symbol: string) => void;
}

/**
 * One screener result on a phone, in place of a table row. The card shows the
 * ticker and name, the price and its 1M change, three key figures, and the
 * 52-week range. The reader reads a screen without scrolling a wide table
 * sideways.
 *
 * A tap anywhere on the card opens the company preview, and the ticker is the
 * button that gives keyboard access. The range stays outside that button, so
 * a screen reader announces it as a meter. The third key figure follows the
 * sort. Its label turns from muted to `foreground` ink to show that the list
 * is ordered by it. The open card carries the same thin accent mark as the
 * selected table row (DESIGN.md §7). Separators between cards belong to the
 * list.
 */
function ScreenerResultCard({
	stock,
	highlightField = null,
	selected = false,
	onSelect,
	className,
	...props
}: ScreenerResultCardProps) {
	const figures = cardFigures(highlightField);

	return (
		// The ticker button gives keyboard access. The card click is a larger
		// touch target for the same action. A drag that selects text to copy
		// does not count as a tap.
		// biome-ignore lint/a11y/useKeyWithClickEvents: the ticker button handles the keyboard
		// biome-ignore lint/a11y/noStaticElementInteractions: see the comment above
		<div
			{...props}
			data-slot="screener-result-card"
			data-state={selected ? "selected" : undefined}
			onClick={(event) => {
				props.onClick?.(event);
				if (window.getSelection()?.toString()) return;
				onSelect(stock.symbol);
			}}
			className={cn(
				"flex w-full cursor-pointer flex-col gap-3 px-3 py-4 data-[state=selected]:bg-muted/70 data-[state=selected]:shadow-[inset_3px_0_0_var(--color-chart-3)]",
				className,
			)}
		>
			<div className="flex w-full items-start justify-between gap-3">
				<button
					type="button"
					aria-haspopup="dialog"
					onClick={(event) => {
						event.stopPropagation();
						onSelect(stock.symbol);
					}}
					className="flex min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				>
					<span className="font-monospace text-xl font-medium">
						{stock.symbol}
					</span>
					<span className="max-w-full truncate text-base text-muted-foreground">
						{stock.name} · {stock.country}
					</span>
				</button>
				<div className="flex shrink-0 flex-col items-end gap-0.5 font-monospace">
					<span className="text-xl">{formatPrice(stock.price)}</span>
					<span
						className={cn(
							"text-base",
							CHANGE_TONE_CLASS[changeTone(stock.changePercent1M)],
						)}
					>
						{formatSignedPercent(stock.changePercent1M)}
					</span>
				</div>
			</div>
			{/* Deviation from DESIGN.md §7: the figures read left, each under its
			    label, as a card's columns do. A table's right edge does not exist
			    here to align them to. */}
			<dl className="grid w-full grid-cols-3 gap-x-2 gap-y-3">
				{figures.map(({ field, highlighted }) => {
					const text = formatMetric(stock[field], field);
					return (
						<div key={field} className="flex flex-col gap-0.5">
							<dt
								className={cn(
									"truncate text-sm",
									highlighted
										? "font-medium text-foreground"
										: "text-muted-foreground",
								)}
							>
								{METRICS[field].short}
								{highlighted ? <span className="sr-only">, sorted</span> : null}
							</dt>
							<dd
								className={cn(
									"font-monospace text-lg",
									text === MISSING && "text-muted-foreground/60",
									highlighted && "font-medium",
								)}
							>
								{text}
							</dd>
						</div>
					);
				})}
				{/* The range takes its own row, so the three figures share the
				    full width on a phone. */}
				<div className="col-span-3 flex flex-col gap-0.5">
					<dt className="text-sm text-muted-foreground">52 weeks</dt>
					<dd>
						<RangeBar
							aria-label={`${stock.symbol} 52-week range`}
							formatBound={formatPrice}
							value={stock.price}
							low={stock.weekLow52}
							high={stock.weekHigh52}
						/>
					</dd>
				</div>
			</dl>
		</div>
	);
}

export { ScreenerResultCard, type ScreenerResultCardProps };
