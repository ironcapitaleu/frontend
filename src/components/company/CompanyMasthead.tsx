import type * as React from "react";

import { RangeBar } from "@/components/ui/range-bar";
import { priceChangeOneMonth } from "@/lib/company/metrics";
import type { Figure, MastheadSection } from "@/lib/company/types";
import { cn } from "@/lib/utils";
import {
	CHANGE_TONE_CLASS,
	MISSING,
	changeTone,
	formatPrice,
	formatSignedPercent,
} from "../screener/format";

/** Props for {@link CompanyMasthead}. */
interface CompanyMastheadProps extends React.ComponentProps<"header"> {
	masthead: MastheadSection;
}

/** The dimmed ink of a missing figure (DESIGN.md §8). */
const DIMMED = "text-muted-foreground/60";

const CHIP =
	"inline-flex rounded-md border border-border px-2 py-0.5 font-monospace text-base";

/**
 * The masthead of the company page, the first region of every tab
 * (DESIGN.md §8 "Shared Layout"). It holds the company name in
 * `font-classic`, the listings, sector, country, reporting currency and fiscal
 * year end, then the price with its change over one month and the 52-week
 * range.
 *
 * Every figure is a claim, and the masthead shows its value. A missing figure
 * is a dimmed `—`. The source card of each figure comes with `SourceCard` in a
 * later ticket. The Export button waits for the Export milestone.
 *
 * On a phone the masthead shows the first listing with a count of the others,
 * such as "+2 listings", and drops the fiscal year end.
 */
function CompanyMasthead({
	masthead,
	className,
	...props
}: CompanyMastheadProps) {
	const [first, ...others] = masthead.listings;
	const price = figureNumber(masthead.price);
	const changeFraction = figureNumber(priceChangeOneMonth(masthead));
	const change = changeFraction === null ? null : changeFraction * 100;

	return (
		<header
			data-slot="company-masthead"
			className={cn(
				"flex flex-col gap-6 pb-6 md:flex-row md:items-end md:justify-between md:gap-12",
				className,
			)}
			{...props}
		>
			<div className="flex min-w-0 flex-col gap-3">
				<h1 className="font-classic text-4xl font-medium leading-tight md:text-48">
					{masthead.name}
				</h1>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg text-muted-foreground">
					<ul aria-label="Listings" className="flex flex-wrap gap-2">
						{first && (
							<li className={cn(CHIP, "text-foreground")}>
								{listingLabel(first)}
							</li>
						)}
						{others.map((listing) => (
							<li
								key={listingLabel(listing)}
								className={cn(CHIP, "hidden md:inline-flex")}
							>
								{listingLabel(listing)}
							</li>
						))}
						{others.length > 0 && (
							<li className={cn(CHIP, "md:hidden")}>
								{otherListingsLabel(others.length)}
							</li>
						)}
					</ul>
					<span>
						{masthead.sector} · {masthead.country} · Reports in{" "}
						{masthead.reportingCurrency}
						<span className="hidden md:inline">
							{" "}
							· Fiscal year ends {masthead.fiscalYearEnd}
						</span>
					</span>
				</div>
			</div>
			<div className="flex shrink-0 flex-col gap-2 md:items-end">
				<dl className="flex items-baseline gap-3 font-monospace">
					<div>
						<dt className="sr-only">Price</dt>
						<dd
							className={cn("text-4xl font-medium", price === null && DIMMED)}
						>
							{price === null ? MISSING : formatPrice(price)}
						</dd>
					</div>
					<div>
						<dt className="sr-only">Change over one month</dt>
						<dd
							className={cn(
								"text-lg",
								change === null
									? DIMMED
									: CHANGE_TONE_CLASS[changeTone(change)],
							)}
						>
							{change === null ? MISSING : `${formatSignedPercent(change)} 1M`}
						</dd>
					</div>
				</dl>
				<RangeBar
					size="md"
					aria-label="52-week range"
					className="w-44"
					value={price}
					low={figureNumber(masthead.low52Weeks)}
					high={figureNumber(masthead.high52Weeks)}
					formatBound={formatPrice}
				/>
				<span className="text-sm text-muted-foreground" aria-hidden="true">
					52-week range
				</span>
			</div>
		</header>
	);
}

/** The number a figure holds, or `null` for a missing figure or a text claim. */
function figureNumber(figure: Figure): number | null {
	return typeof figure?.value === "number" ? figure.value : null;
}

function listingLabel(listing: MastheadSection["listings"][number]): string {
	return `${listing.exchange}: ${listing.symbol}`;
}

/** The phone label for the listings after the first, such as "+2 listings". */
function otherListingsLabel(count: number): string {
	return `+${count} ${count === 1 ? "listing" : "listings"}`;
}

export { CompanyMasthead, type CompanyMastheadProps };
