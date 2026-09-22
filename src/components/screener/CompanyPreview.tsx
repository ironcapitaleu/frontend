import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { RangeBar } from "@/components/ui/range-bar";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
	type FilterDescription,
	type FilterState,
	type Stock,
	describeActiveFilters,
} from "@/pages/public/StockScreener.logic";

import {
	CHANGE_TONE_CLASS,
	METRICS,
	type MetricField,
	changeTone,
	formatNumber,
	formatPercent,
	formatPrice,
	formatSignedPercent,
} from "./format";

/** The key figures in the preview grid, in reading order. */
const KEY_FIGURES: readonly MetricField[] = [
	"marketCap",
	"peRatio",
	"priceToFcf",
	"priceToCash",
	"quickRatio",
	"currentRatio",
	"dividendYield",
	"buybackYield",
];

interface CompanyPreviewProps {
	/** The company to preview. `null` renders nothing. */
	stock: Stock | null;
	/** The active filters. The "Why it matched" list reads from them. */
	filters: FilterState;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * A side sheet that previews one company from the result list. The reader
 * checks its key figures and why it passed the screen before leaving the page.
 *
 * The name is the one serif title in the sheet (`font-classic`). Below it sit
 * the price and 1M change, a `md` `RangeBar` for the 52-week range, the "Why
 * it matched" list, and a grid of eight key figures. The footer links to the
 * company page.
 */
function CompanyPreview({
	stock,
	filters,
	open,
	onOpenChange,
}: CompanyPreviewProps) {
	if (!stock) return null;
	const reasons = describeActiveFilters(filters);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetBody className="flex flex-col gap-0 p-0">
					<header className="flex flex-col gap-4 border-b border-border p-6 pr-16">
						<div className="flex flex-col gap-1">
							<span className="font-monospace text-base text-muted-foreground">
								{stock.symbol} · {stock.sector} · {stock.country}
							</span>
							<SheetTitle className="font-classic text-4xl font-medium">
								{stock.name}
							</SheetTitle>
						</div>
						<div className="flex items-baseline gap-3 font-monospace">
							<span className="text-5xl font-medium">
								{formatPrice(stock.price)}
							</span>
							<span
								className={cn(
									"text-lg",
									CHANGE_TONE_CLASS[changeTone(stock.changePercent1M)],
								)}
							>
								{formatSignedPercent(stock.changePercent1M)} 1M
							</span>
						</div>
						<RangeBar
							size="md"
							aria-label="52-week range"
							value={stock.price}
							low={stock.weekLow52}
							high={stock.weekHigh52}
							formatBound={formatPrice}
						/>
						<SheetDescription className="text-base">
							{describeRangePosition(stock)}
						</SheetDescription>
					</header>

					<section
						aria-labelledby="why-it-matched"
						className="flex flex-col gap-3 border-b border-border p-6"
					>
						<h3
							id="why-it-matched"
							className="font-sans-serif text-sm font-medium tracking-wider text-muted-foreground uppercase"
						>
							Why it matched
						</h3>
						{reasons.length === 0 ? (
							<p className="text-lg text-muted-foreground">
								No filter is active, so every company matches.
							</p>
						) : (
							<ul className="flex flex-col gap-2">
								{reasons.map((reason) => (
									<li
										key={reason.field}
										className="flex items-baseline gap-3 text-lg"
									>
										<span className="flex-1">{reason.label}</span>
										<span className="font-monospace">
											{matchValue(stock, reason)}
										</span>
										<span className="w-16 text-right font-monospace text-muted-foreground">
											{reason.value}
										</span>
									</li>
								))}
							</ul>
						)}
					</section>

					<section aria-label="Key figures" className="p-6">
						<dl className="grid grid-cols-2 gap-x-6 gap-y-3">
							{KEY_FIGURES.map((field) => (
								<div
									key={field}
									className="flex items-baseline justify-between gap-2 border-b border-border pb-2"
								>
									<dt className="text-base text-muted-foreground">
										{METRICS[field].label}
									</dt>
									<dd className="font-monospace text-lg">
										{METRICS[field].format(stock[field])}
									</dd>
								</div>
							))}
						</dl>
					</section>
				</SheetBody>
				<footer className="border-t border-border p-6">
					<Link
						to={`/companies/${stock.symbol}`}
						className={cn(
							buttonVariants({ size: "lg" }),
							"btn-tactile h-11 w-full bg-foreground text-lg text-background hover:bg-foreground/90",
						)}
					>
						Open company page
					</Link>
				</footer>
			</SheetContent>
		</Sheet>
	);
}

/**
 * The stock's own value for one active filter, so the reader sees the number
 * next to the bound it passed. A switch filter shows `Yes`.
 */
export function matchValue(stock: Stock, reason: FilterDescription): string {
	switch (reason.field) {
		case "search":
			return stock.symbol;
		case "country":
			return stock.country;
		case "sector":
			return stock.sector;
		case "peMin":
		case "peMax":
			return formatNumber(stock.peRatio);
		case "priceToFcfMax":
			return formatNumber(stock.priceToFcf);
		case "priceToCashMax":
			return formatNumber(stock.priceToCash);
		case "quickRatioMin":
			return formatNumber(stock.quickRatio, 2);
		case "currentRatioMin":
			return formatNumber(stock.currentRatio, 2);
		case "dividendYieldMin":
			return formatPercent(stock.dividendYield);
		case "buybackYieldMin":
			return formatPercent(stock.buybackYield);
		case "downLastMonth":
			return formatSignedPercent(stock.changePercent1M);
		case "nearFiftyTwoWeekLow":
			return "Yes";
	}
}

/** One sentence on where the price sits against its 52-week low. */
export function describeRangePosition(stock: Stock): string {
	const aboveLow = Math.round((stock.price / stock.weekLow52 - 1) * 100);
	if (aboveLow <= 0) return "Trading at its 52-week low.";
	return `Trading ${aboveLow}% above its 52-week low.`;
}

export { CompanyPreview, type CompanyPreviewProps };
