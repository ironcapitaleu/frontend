import * as React from "react";

import { formatInUnit } from "@/components/company/format";
import { MiniBarChart } from "@/components/company/MiniBarChart";
import { ShareBar } from "@/components/company/ShareBar";
import {
	formatPrice,
	MISSING,
	MISSING_INK,
} from "@/components/screener/format";
import { RangeBar } from "@/components/ui/range-bar";
import { useCompany } from "@/hooks/useCompany";
import { formatDate } from "@/lib/company/dates";
import { keyFigureKeys, keyFigureOf, metrics } from "@/lib/company/metrics";
import { sectorMedianOf } from "@/lib/company/sources";
import type {
	CompletedSections,
	Figure,
	MastheadSection,
} from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import { cn } from "@/lib/utils";
import { ChecksByArea } from "./tabs/ChecksByArea";
import { FigureText } from "./tabs/FigureCell";
import {
	joinSections,
	loadedSections,
	revenueParts,
	tenYearsSeries,
} from "./tabs/OverviewTab.logic";

/** The series of the bar chart in "The business". */
const BUSINESS_SERIES = ["revenue", "freeCashFlow"];

/**
 * The printed summary of the Overview tab (DESIGN.md §8 "Print Summary"), in
 * the Value Line style. It is `hidden` on the screen, and the print
 * stylesheet shows it in place of the tab. It draws the masthead, the strip of key
 * figures, then "The business" and "Checks by area" side by side. Regions 4
 * to 6 follow them, in the order of DESIGN.md §8. It loads the sections its
 * figures read, and draws its figures once no load is pending.
 */
export function PrintSummary({
	ticker,
	masthead,
}: {
	ticker: Ticker;
	masthead: MastheadSection;
}) {
	const loads = [
		useCompany(ticker, "masthead"),
		useCompany(ticker, "overview"),
		useCompany(ticker, "financials"),
		useCompany(ticker, "valuation"),
		useCompany(ticker, "shareholderReturns"),
	];
	const pending = loads.some(({ status }) => status === "loading");
	// Each loaded section keeps its identity, so the joined sections do too.
	const [first, second, third, fourth, fifth] = loads.map(loadedSections);
	const sections = React.useMemo(
		() => joinSections([first, second, third, fourth, fifth]),
		[first, second, third, fourth, fifth],
	);

	return (
		<article
			hidden
			data-slot="print-summary"
			aria-label="Printed summary"
			className="flex-col gap-4 text-sm"
		>
			<PrintMasthead masthead={masthead} />
			{pending || sections === null ? (
				<p>The summary is still loading.</p>
			) : (
				<>
					<Region title="Key figures">
						<KeyFigureStrip sections={sections} />
					</Region>
					<div className="grid grid-cols-2 gap-6">
						<Region title="The business">
							<Business sections={sections} />
						</Region>
						<Region title="Checks by area">
							<ChecksByArea sections={sections} />
						</Region>
					</div>
				</>
			)}
		</article>
	);
}

/**
 * Region 1: the wordmark, the company name, the listings, sector, country and
 * currency, and on the right the price, the 52-week range and the date of the
 * closing price.
 */
function PrintMasthead({ masthead }: { masthead: MastheadSection }) {
	const price = numberOf(masthead.price);
	const closedOn = masthead.price?.period?.endsOn;
	const facts = [
		...masthead.listings.map(
			({ exchange, symbol }) => `${exchange}: ${symbol}`,
		),
		masthead.sector,
		masthead.country,
		`Reports in ${masthead.reportingCurrency}`,
	];
	return (
		<header className="flex items-end justify-between gap-6 border-b-2 border-foreground pb-3">
			<div className="flex min-w-0 flex-col gap-1">
				<p className="font-classic text-base uppercase tracking-widest">
					Iron Capital
				</p>
				<h1 className="font-classic text-4xl font-medium leading-tight">
					{masthead.name}
				</h1>
				<p className="text-muted-foreground">{facts.join(" · ")}</p>
			</div>
			<div className="flex shrink-0 flex-col items-end gap-1">
				<p
					className={cn(
						"font-monospace text-3xl font-medium",
						price === null && MISSING_INK,
					)}
				>
					{price === null ? MISSING : formatPrice(price)}
				</p>
				<RangeBar
					aria-label="52-week range"
					className="w-40"
					value={price}
					low={numberOf(masthead.low52Weeks)}
					high={numberOf(masthead.high52Weeks)}
					formatBound={formatPrice}
				/>
				<p className="text-muted-foreground">
					{closedOn ? `Closing price of ${formatDate(closedOn)}` : MISSING}
				</p>
			</div>
		</header>
	);
}

/** Region 2: the eight key figures in one strip, each but market cap with its sector median. */
function KeyFigureStrip({ sections }: { sections: CompletedSections }) {
	return (
		<dl className="grid grid-cols-8 gap-3">
			{keyFigureKeys.map((key) => (
				<div key={key} className="flex flex-col">
					<dt className="text-muted-foreground">{metrics[key].name}</dt>
					<dd className="font-monospace text-lg">
						<FigureText figure={keyFigureOf(key, sections)} />
					</dd>
					{key !== "marketCap" && (
						<dd className="font-monospace text-muted-foreground">
							<span className="font-sans-serif">Median </span>
							<FigureText figure={sectorMedianOf(key, sections)} />
						</dd>
					)}
				</div>
			))}
		</dl>
	);
}

/** "The business": the company summary, the revenue by segment, and revenue and free cash flow by fiscal year. */
function Business({ sections }: { sections: CompletedSections }) {
	const { overview } = sections;
	const series = React.useMemo(
		() =>
			tenYearsSeries(sections).filter(({ key }) =>
				BUSINESS_SERIES.includes(key),
			),
		[sections],
	);
	return (
		<div className="flex flex-col gap-4">
			<p className={cn(!overview?.business && MISSING_INK)}>
				{overview?.business?.value ?? MISSING}
			</p>
			{overview && (
				<ShareBar
					aria-label="Revenue by segment"
					parts={revenueParts(overview, "segments")}
				/>
			)}
			<div className="grid grid-cols-2 gap-4">
				{series.map((each) => (
					<MiniBarChart
						key={each.key}
						series={each}
						formatValue={(value) => formatInUnit(value, each.unit)}
					/>
				))}
			</div>
		</div>
	);
}

/** One region of the printed page: a title over a rule, then its content. */
function Region({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section aria-label={title} className="flex min-w-0 flex-col gap-2">
			<h2 className="border-b border-foreground font-serif text-lg font-semibold">
				{title}
			</h2>
			{children}
		</section>
	);
}

/** The number a figure holds, or `null` for a missing, non-finite or text claim. */
function numberOf(figure: Figure): number | null {
	return typeof figure?.value === "number" && Number.isFinite(figure.value)
		? figure.value
		: null;
}
