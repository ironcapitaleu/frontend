import * as React from "react";

import { formatInput, formatInUnit } from "@/components/company/format";
import { MiniBarChart } from "@/components/company/MiniBarChart";
import { ShareBar } from "@/components/company/ShareBar";
import {
	formatPrice,
	MISSING,
	MISSING_INK,
} from "@/components/screener/format";
import { RangeBar } from "@/components/ui/range-bar";
import { useCompany } from "@/hooks/useCompany";
import { formatDate, localIsoDate } from "@/lib/company/dates";
import {
	financialPositionOf,
	keyFigureKeys,
	keyFigureOf,
	metrics,
} from "@/lib/company/metrics";
import {
	documentLabel,
	figureGroupsOf,
	filingsOf,
	isSectorBenchmark,
	sectorMedianOf,
} from "@/lib/company/sources";
import type {
	BlockKey,
	Claim,
	CompletedSections,
	Figure,
	Filing,
	MastheadSection,
} from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import { cn } from "@/lib/utils";
import { ChecksByArea } from "./tabs/ChecksByArea";
import { FigureText } from "./tabs/FigureCell";
import {
	joinSections,
	loadedSections,
	ownershipParts,
	resultsSeries,
	revenueParts,
	SIDES,
	tenYearsSeries,
} from "./tabs/OverviewTab.logic";

/** The series of the bar chart in "The business". */
const BUSINESS_SERIES = ["revenue", "freeCashFlow"];

/**
 * The Overview blocks whose figures the printed page draws. The sources
 * footer names the filings behind them and leaves out the Profile, which
 * the paper does not show.
 */
const PRINTED_BLOCKS: ReadonlySet<BlockKey> = new Set<BlockKey>([
	"business",
	"tenYears",
	"keyFigures",
	"financialPosition",
	"checksByArea",
	"ownership",
	"printedShareholderReturns",
]);

/** The state of the sections that the printed summary reads. */
export type PrintSections =
	| { readonly status: "loading" }
	| { readonly status: "failed" }
	| { readonly status: "loaded"; readonly sections: CompletedSections };

/**
 * Loads the sections that the printed summary reads. It is `loading` while
 * any load is pending, `failed` when none of them loaded, and `loaded`
 * otherwise. The page disables the Export button while it is `loading`, so
 * the paper never shows a summary that is still loading.
 */
export function usePrintSections(ticker: Ticker): PrintSections {
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
	return React.useMemo(() => {
		if (pending) return { status: "loading" };
		if (sections === null) return { status: "failed" };
		return { status: "loaded", sections };
	}, [pending, sections]);
}

/**
 * The printed summary of the Overview tab (DESIGN.md §8 "Print Summary"), in
 * the Value Line style. It is `hidden` on the screen, and the print
 * stylesheet shows it in place of the tab. The first page draws the
 * masthead, the strip of key figures, then "The business" and "Checks by
 * area" side by side. The second page draws the ten years of results, the
 * balance sheet, shareholder returns and ownership blocks, and the sources
 * footer, which gives `generatedOn` as the date generated. While `summary`
 * loads, or when it failed, a sentence says so under the masthead.
 */
export function PrintSummary({
	masthead,
	summary,
	generatedOn = new Date(),
}: {
	masthead: MastheadSection;
	summary: PrintSections;
	generatedOn?: Date;
}) {
	return (
		<article
			hidden
			data-slot="print-summary"
			aria-label="Printed summary"
			className="flex-col gap-4 text-sm"
		>
			<PrintMasthead masthead={masthead} />
			{summary.status === "loading" ? (
				<p>The summary is still loading.</p>
			) : summary.status === "failed" ? (
				<p>The figures of this summary did not load. Try again in a moment.</p>
			) : (
				<>
					<Region title="Key figures">
						<KeyFigureStrip sections={summary.sections} />
					</Region>
					<div className="grid grid-cols-3 gap-6">
						<Region title="The business">
							<Business sections={summary.sections} />
						</Region>
						<Region title="Checks by area" className="col-span-2">
							<ChecksByArea sections={summary.sections} />
						</Region>
					</div>
					<div
						data-slot="print-second-page"
						className="flex break-before-page flex-col gap-4"
					>
						<Region title="Ten years of results">
							<Results sections={summary.sections} />
						</Region>
						<div className="grid grid-cols-3 gap-6">
							<Region title="Balance sheet">
								<BalanceSheet sections={summary.sections} />
							</Region>
							<Region title="Shareholder returns">
								<ShareholderReturns sections={summary.sections} />
							</Region>
							<Region title="Ownership">
								<Ownership sections={summary.sections} />
							</Region>
						</div>
						<SourcesFooter
							sections={summary.sections}
							generatedOn={generatedOn}
						/>
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
			<div className="flex flex-col gap-4">
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

/**
 * Region 4: a table of the main income, cash flow and share lines, one
 * column per fiscal year. Before Financials loads it is a dimmed dash.
 */
function Results({ sections }: { sections: CompletedSections }) {
	const series = React.useMemo(() => resultsSeries(sections), [sections]);
	const years = (series[0]?.periods ?? []).map(({ fiscalYear }) => fiscalYear);
	if (series.length === 0) return <Missing />;
	return (
		<table aria-label="Ten years of results" className="w-full">
			<thead>
				<tr className="text-muted-foreground">
					<th className="text-left font-normal">Fiscal year</th>
					{years.map((year) => (
						<th key={year} className="text-right font-monospace font-normal">
							{year}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{series.map(({ key, label, unit, points }) => (
					<tr key={key} className="border-t border-border">
						<th scope="row" className="text-left font-normal">
							{label}
						</th>
						{points.map((point, column) => (
							<td key={years[column]} className="text-right font-monospace">
								<FigureText
									figure={point}
									format={(value) => formatInput({ value, unit })}
								/>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

/** Region 5, first block: the assets and liabilities of Financial Position, short and long term. */
function BalanceSheet({ sections }: { sections: CompletedSections }) {
	if (sections.financials === null) return <Missing />;
	return (
		<table aria-label="Balance sheet" className="w-full">
			<thead>
				<tr className="text-muted-foreground">
					<th className="text-left font-normal">Term</th>
					{SIDES.map(({ key, label }) => (
						<th key={key} className="text-right font-normal">
							{label}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{financialPositionOf(sections).map((row) => (
					<tr key={row.term} className="border-t border-border">
						<th scope="row" className="text-left font-normal">
							{row.term}
						</th>
						{SIDES.map(({ key }) => (
							<td key={key} className="text-right font-monospace">
								<FigureText figure={row[key]} />
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

/**
 * Region 5, second block: the latest dividend per share and the latest
 * dividend declared. Each is a dimmed dash until `shareholderReturns` loads.
 */
function ShareholderReturns({ sections }: { sections: CompletedSections }) {
	const returns = sections.shareholderReturns;
	const latest = returns?.dividendPerShare.points.at(-1) ?? null;
	const declared = returns?.latestDividendDeclared ?? null;
	const declaredOn = declared?.period?.endsOn;
	const rows: [string, Figure][] = [
		[`Dividend per share${fiscalYearOf(latest)}`, latest],
		[
			`Latest dividend declared${declaredOn ? `, ${formatDate(declaredOn)}` : ""}`,
			declared,
		],
	];
	return (
		<dl className="flex flex-col gap-1">
			{rows.map(([label, figure]) => (
				<div key={label} className="flex justify-between gap-2">
					<dt>{label}</dt>
					<dd className="font-monospace">
						<FigureText
							figure={figure}
							format={(value) => formatInput({ value, unit: "usdPerShare" })}
						/>
					</dd>
				</div>
			))}
		</dl>
	);
}

/** Region 5, third block: the ownership bar of the Overview card "Who Owns It". */
function Ownership({ sections }: { sections: CompletedSections }) {
	const { overview } = sections;
	if (overview === null) return <Missing />;
	return (
		<ShareBar
			aria-label="Ownership split"
			parts={ownershipParts(overview, "overview")}
		/>
	);
}

/**
 * Region 6: the filings behind the printed figures, the sample-data notice
 * and the date generated. The print stylesheet puts the page number at the
 * foot of each page.
 */
function SourcesFooter({
	sections,
	generatedOn,
}: {
	sections: CompletedSections;
	generatedOn: Date;
}) {
	const filings = React.useMemo(() => printedFilings(sections), [sections]);
	const date = formatDate(localIsoDate(generatedOn));
	return (
		<section
			aria-label="Sources"
			className="flex flex-col gap-1 border-t border-foreground pt-2 text-muted-foreground"
		>
			<p data-slot="print-filings">
				Filings: {filings.length > 0 ? filings.join(" · ") : MISSING}
			</p>
			<p>
				Sample data. The company and its figures are made up. Generated on{" "}
				{date}.
			</p>
		</section>
	);
}

/**
 * Names the filings behind the printed figures: the company figures of
 * {@link PRINTED_BLOCKS} and the points of region 4. It gives one entry for
 * each form, with the newest filing's form first. A form with one filing
 * gets its label, such as "8-K for 28 May 2026, Meridian Semiconductor
 * Corp.", and a form with more gets its periods and a count, such as "10-K
 * for FY2017 to FY2026 (10 filings)". The sector medians are left out, so
 * the footer names no peer filing.
 */
function printedFilings(sections: CompletedSections): string[] {
	const claims = [
		...figureGroupsOf("overview", sections)
			.filter(({ ref }) => PRINTED_BLOCKS.has(ref.block))
			.filter(({ ref }) => !isSectorBenchmark(ref))
			.flatMap(({ claims }) => claims),
		...resultsSeries(sections)
			.flatMap(({ points }) => points)
			.filter((point): point is Claim => point !== null),
	];
	const byForm = new Map<string, Filing[]>();
	for (const filing of filingsOf(claims)) {
		byForm.set(filing.form, [...(byForm.get(filing.form) ?? []), filing]);
	}
	return [...byForm.values()].map((filings) => {
		const [newest] = filings;
		const oldest = filings.at(-1);
		if (filings.length === 1 || !newest || !oldest) {
			return filings.map(documentLabel).join(" · ");
		}
		const periods =
			newest.periodLabel === oldest.periodLabel
				? newest.periodLabel
				: `${oldest.periodLabel} to ${newest.periodLabel}`;
		return `${newest.form} for ${periods} (${filings.length} filings)`;
	});
}

/** `, FY2025` for a figure of fiscal year 2025, or nothing when it has no fiscal year. */
function fiscalYearOf(figure: Figure): string {
	const year = figure?.period?.fiscalYear;
	return year ? `, FY${year}` : "";
}

/** The dimmed dash of a block whose section did not load. */
function Missing() {
	return <p className={cn("font-monospace", MISSING_INK)}>{MISSING}</p>;
}

/** One region of the printed page: a title over a rule, then its content. */
function Region({
	title,
	className,
	children,
}: {
	title: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<section
			aria-label={title}
			className={cn("flex min-w-0 flex-col gap-2", className)}
		>
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
