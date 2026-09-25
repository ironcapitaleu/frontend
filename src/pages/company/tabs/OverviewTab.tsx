import * as React from "react";

import { ChartActions } from "@/components/company/ChartActions";
import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { FIXED_COLUMN, formatInUnit } from "@/components/company/format";
import { barStyle, MiniBarChart } from "@/components/company/MiniBarChart";
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
import { figureGroupsOf, isDrawn, sectorMedianOf } from "@/lib/company/sources";
import type { CompletedSections } from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import { cn } from "@/lib/utils";
import { FigureCell, FigureText } from "./FigureCell";
import {
	heldBack,
	joinSections,
	loadedSections,
	positionBars,
	revenueParts,
	SIDES,
	tenYearsSeries,
} from "./OverviewTab.logic";

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
				? figureGroupsOf("overview", sections).filter(({ ref }) => isDrawn(ref))
				: [],
		[sections],
	);
	const [positionData, setPositionData] = React.useState(false);

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
				className="min-w-0"
				actions={
					<ChartActions
						data={positionData}
						onData={setPositionData}
						claims={
							groups.find(({ ref }) => ref.block === "financialPosition")
								?.claims ?? []
						}
					/>
				}
			>
				<Loaded state={financials} what="financial position">
					{({ sections }) =>
						positionData ? (
							<PositionTable rows={financialPositionOf(sections)} />
						) : (
							<PositionBars rows={financialPositionOf(sections)} />
						)
					}
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

/**
 * The bars of card 1.4 "Financial Position", one plot for each term, with
 * assets and liabilities side by side on one scale that holds zero. A
 * negative figure draws below the zero line, as its legend prints it. A
 * reported zero draws a 2 px mark on the zero line. Each bar is a button the
 * height of its plot, so its target is at least 24 × 24 px however short the
 * bar. A missing figure gets a dot on the zero line and no button, and its
 * figure is a dimmed dash.
 */
function PositionBars({ rows }: { rows: readonly PositionRow[] }) {
	const { plots, zero } = positionBars(rows);
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{rows.map((row, index) => (
				<figure
					key={row.term}
					data-slot="position-plot"
					className="flex flex-col gap-2"
				>
					<figcaption className="text-muted-foreground text-sm">
						{row.term}
					</figcaption>
					<div className="relative h-40">
						<ul className="flex h-full justify-center gap-4">
							{plots[index]?.map(
								({ side, figure, value, top, height, text }) =>
									value === null || figure === null ? (
										<li key={side.key} className="relative w-10">
											<span
												className="absolute left-1/2 size-1.5 -translate-1/2 rounded-full bg-muted-foreground/60"
												style={{ top: `${zero}%` }}
											>
												<span className="sr-only">{text}</span>
											</span>
										</li>
									) : (
										<li key={side.key} className="relative w-10">
											<SourceTrigger
												claim={figure}
												className="absolute inset-0 block"
											>
												<span className="sr-only">{text}</span>
												<span
													data-slot="position-bar"
													className={cn(
														"absolute inset-x-0",
														value < 0 ? "rounded-b-sm" : "rounded-t-sm",
														side.fill,
													)}
													style={barStyle({ top, height })}
												/>
											</SourceTrigger>
										</li>
									),
							)}
						</ul>
						<div
							className="pointer-events-none absolute inset-x-0 h-px bg-muted-foreground/50"
							style={{ top: `${zero}%` }}
							aria-hidden="true"
						/>
					</div>
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

/** The table behind the Data button of card 1.4: each term's assets and liabilities. */
function PositionTable({ rows }: { rows: readonly PositionRow[] }) {
	return (
		<Table aria-label="Financial Position table">
			<TableHeader>
				<TableRow>
					<TableHead className={FIXED_COLUMN}>Term</TableHead>
					{SIDES.map(({ key, label }) => (
						<TableHead key={key} className="text-right">
							{label}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row) => (
					<TableRow key={row.term}>
						<TableHead scope="row" className={FIXED_COLUMN}>
							{row.term}
						</TableHead>
						{SIDES.map(({ key }) => (
							<FigureCell key={key} figure={row[key]} />
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
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
