import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { formatInUnit } from "@/components/company/format";
import { MiniBarChart } from "@/components/company/MiniBarChart";
import { ShareBar } from "@/components/company/ShareBar";
import { SourceTrigger } from "@/components/company/SourceCard";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { type CompanyState, useCompany } from "@/hooks/useCompany";
import {
	financialPositionOf,
	keyFigureKeys,
	keyFigureOf,
	metrics,
	type PositionRow,
} from "@/lib/company/metrics";
import { figureGroupsOf, sectorMedianOf } from "@/lib/company/sources";
import type { BlockKey, CompletedSections, Figure } from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import { cn } from "@/lib/utils";
import {
	heldBack,
	joinSections,
	loadedSections,
	revenueParts,
	tenYearsSeries,
} from "./OverviewTab.logic";

/**
 * The blocks this tab draws today. The Sources index names only these, so it
 * names no filing of a card that a later ticket adds.
 */
const DRAWN_BLOCKS: ReadonlySet<BlockKey> = new Set([
	"business",
	"tenYears",
	"keyFigures",
	"financialPosition",
]);

/**
 * The Overview tab of the company page (DESIGN.md §8 "Overview"). It draws
 * card 1.1 "The Business" from the Overview section, card 1.2 "Ten Years at
 * a Glance" from the Financials section and card 1.3 "Key Figures" from the
 * masthead, Overview, Financials and Valuation sections, and card 1.4
 * "Financial Position" from the Financials section, then the sources index.
 * Each card shows the loading or failed state of its own section, so a slow
 * section never delays another card.
 */
export function OverviewTab({ ticker }: { ticker: Ticker }) {
	const masthead = useCompany(ticker, "masthead");
	const overview = useCompany(ticker, "overview");
	const financials = useCompany(ticker, "financials");
	const valuation = useCompany(ticker, "valuation");
	// A pending load returns a fresh state object on each render, but its
	// loaded sections keep their identity. Keying on them keeps the same
	// sections and groups, so `SourcesIndex` keeps its memo.
	const loaded = [masthead, overview, financials, valuation].map(
		loadedSections,
	);
	const [mastheadPart, overviewPart, financialsPart, valuationPart] = loaded;
	const sections = React.useMemo(
		() =>
			joinSections([mastheadPart, overviewPart, financialsPart, valuationPart]),
		[mastheadPart, overviewPart, financialsPart, valuationPart],
	);
	const groups = React.useMemo(
		() =>
			sections
				? figureGroupsOf("overview", sections).filter(({ ref }) =>
						DRAWN_BLOCKS.has(ref.block),
					)
				: [],
		[sections],
	);

	return (
		<CompanyCardGrid>
			<CompanyCard
				tab="overview"
				position={1}
				title="The Business"
				caption="Latest fiscal year · Share of revenue · Form 10-K"
				span={2}
			>
				<Loaded state={overview} what="business">
					{({ data }) => (
						<div className="flex flex-col gap-6">
							{data.business === null ? (
								<p className={cn("font-monospace", MISSING_INK)}>{MISSING}</p>
							) : (
								// The text is prose, not a figure, so it stays a justified
								// paragraph and a short word after it opens its source.
								<div className="flex flex-col items-start gap-1">
									<p>{data.business.value}</p>
									<SourceTrigger
										claim={data.business}
										className="text-muted-foreground text-sm"
									>
										Source
									</SourceTrigger>
								</div>
							)}
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<ShareBar
									aria-label="Revenue by segment"
									parts={revenueParts(data, "segments")}
								/>
								<ShareBar
									aria-label="Revenue by region"
									parts={revenueParts(data, "regions")}
								/>
							</div>
						</div>
					)}
				</Loaded>
			</CompanyCard>
			<CompanyCard
				tab="overview"
				position={2}
				title="Ten Years at a Glance"
				caption="Last ten fiscal years · USD, percent and shares · Form 10-K"
				span={2}
			>
				<Loaded state={financials} what="ten-year figures">
					{({ sections }) => <TenYears sections={sections} />}
				</Loaded>
			</CompanyCard>
			<CompanyCard
				tab="overview"
				position={3}
				title="Key Figures"
				caption="Latest price, fiscal year and quarter · Sector median of the peer group · Form 10-K and 10-Q"
			>
				<Loaded state={heldBack(financials, [masthead])} what="key figures">
					{() => sections && <KeyFigures sections={sections} />}
				</Loaded>
			</CompanyCard>
			<CompanyCard
				tab="overview"
				position={4}
				title="Financial Position"
				caption="Latest quarter end · USD · Form 10-Q or 10-K"
			>
				<Loaded state={financials} what="financial position">
					{({ sections }) => (
						<PositionBars rows={financialPositionOf(sections)} />
					)}
				</Loaded>
			</CompanyCard>
			<div className="lg:col-span-2">
				<SourcesIndex groups={groups} />
			</div>
		</CompanyCardGrid>
	);
}

/**
 * The table of card 1.3: each key figure, and its sector median in muted
 * ink. Market cap has no median, so its median cell stays empty.
 */
function KeyFigures({ sections }: { sections: CompletedSections }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Figure</TableHead>
					<TableHead className="text-right">Company</TableHead>
					<TableHead className="text-right">Sector median</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{keyFigureKeys.map((key) => (
					<TableRow key={key}>
						<TableHead scope="row">{metrics[key].name}</TableHead>
						<FigureCell figure={keyFigureOf(key, sections)} />
						{key === "marketCap" ? (
							<TableCell />
						) : (
							<FigureCell
								figure={sectorMedianOf(key, sections)}
								className="text-muted-foreground"
							/>
						)}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

/** The two sides of each pair of bars in card 1.4, with the chart token of each. */
const SIDES = [
	{ key: "assets", label: "Assets", fill: "bg-chart-2" },
	{ key: "liabilities", label: "Liabilities", fill: "bg-chart-3" },
] as const;

/** Returns the value of `figure` when it is a finite number, or `null`. */
function amountOf(figure: Figure): number | null {
	const value = figure?.value;
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * The bars of card 1.4 "Financial Position", one plot for each term, with
 * assets and liabilities side by side on one scale. Each bar is a button the height of its plot, so
 * its target is at least 24 × 24 px however short the bar. A missing figure
 * gets a dot on the baseline and no button, and its figure is a dimmed dash.
 */
function PositionBars({ rows }: { rows: readonly PositionRow[] }) {
	const values = rows.flatMap((row) =>
		SIDES.map(({ key }) => amountOf(row[key])),
	);
	const high = Math.max(0, ...values.filter((value) => value !== null));
	return (
		<div className="grid grid-cols-2 gap-6">
			{rows.map((row) => (
				<figure
					key={row.term}
					data-slot="position-plot"
					className="flex flex-col gap-2"
				>
					<figcaption className="text-muted-foreground text-sm">
						{row.term}
					</figcaption>
					<ul className="flex h-40 justify-center gap-4 border-muted-foreground/50 border-b">
						{SIDES.map(({ key, label, fill }) => {
							const figure = row[key];
							const value = amountOf(figure);
							const height =
								value === null || high === 0
									? 0
									: (Math.max(value, 0) / high) * 100;
							const text = `${row.term} ${label.toLowerCase()}: ${value === null ? MISSING : formatInUnit(value, "usd")}`;
							return (
								<li key={key} className="relative w-10">
									{value === null || figure === null ? (
										<span className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-muted-foreground/60">
											<span className="sr-only">{text}</span>
										</span>
									) : (
										<SourceTrigger
											claim={figure}
											className="absolute inset-0 block"
										>
											<span className="sr-only">{text}</span>
											<span
												className={cn(
													"absolute inset-x-0 bottom-0 rounded-t-sm",
													fill,
												)}
												style={{ height: `${height}%` }}
											/>
										</SourceTrigger>
									)}
								</li>
							);
						})}
					</ul>
					<dl className="grid grid-cols-2 gap-x-4 text-sm">
						{SIDES.map(({ key, label, fill }) => (
							<div key={key} className="flex flex-col">
								<dt className="flex items-center gap-1.5 text-muted-foreground">
									<span
										className={cn("size-2 rounded-full", fill)}
										aria-hidden="true"
									/>
									{label}
								</dt>
								<dd className="font-monospace">
									<FigureText figure={row[key]} />
								</dd>
							</div>
						))}
					</dl>
				</figure>
			))}
		</div>
	);
}

/** A mono figure that opens its sources, or the dimmed dash when it is missing. */
function FigureText({ figure }: { figure: Figure }) {
	const value = amountOf(figure);
	return figure !== null && value !== null ? (
		<SourceTrigger claim={figure}>
			{formatInUnit(value, figure.unit)}
		</SourceTrigger>
	) : (
		<span className={MISSING_INK}>{MISSING}</span>
	);
}

/** A right-aligned mono figure that opens its sources, or the dimmed dash when it is missing. */
function FigureCell({
	figure,
	className,
}: {
	figure: Figure;
	className?: string;
}) {
	return (
		<TableCell className={cn("text-right font-monospace", className)}>
			<FigureText figure={figure} />
		</TableCell>
	);
}

/**
 * The four small charts of card 1.2: two to a row on a phone and four from
 * 768 px, where DESIGN.md §8 "Shared Layout" keeps the desktop layout.
 */
function TenYears({ sections }: { sections: CompletedSections }) {
	// The same series on each render keep their claim identities stable.
	const series = React.useMemo(() => tenYearsSeries(sections), [sections]);
	return (
		<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
			{series.map((each) => (
				<MiniBarChart
					key={each.key}
					series={each}
					formatValue={(value) => formatInUnit(value, each.unit)}
				/>
			))}
		</div>
	);
}

/** The loaded state of the section `K`. */
type LoadedState<K extends "overview" | "financials"> = Extract<
	CompanyState<K>,
	{ status: "loaded" }
>;

/**
 * Draws `children` with the loaded section, or the state of its load: a
 * spinner while it loads, and one line when it fails.
 */
function Loaded<K extends "overview" | "financials">({
	state,
	what,
	children,
}: {
	state: CompanyState<K>;
	what: string;
	children: (loaded: LoadedState<K>) => React.ReactNode;
}) {
	switch (state.status) {
		case "loading":
			return <Spinner label={`Loading the ${what}`} />;
		case "loaded":
			return children(state as LoadedState<K>);
		default:
			return (
				<Text font="sans" className="text-left">
					The {what} did not load. Try again in a moment.
				</Text>
			);
	}
}
