import * as React from "react";

import { ChartActions } from "@/components/company/ChartActions";
import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import { FIXED_COLUMN, formatInput } from "@/components/company/format";
import {
	formatNumber,
	MISSING,
	MISSING_INK,
} from "@/components/screener/format";
import { rangeBarPosition } from "@/components/ui/range-bar";
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
import { cn } from "@/lib/utils";
import { useCompany } from "../../../hooks/useCompany";
import { metricInputsOf, metrics } from "../../../lib/company/metrics";
import { figureGroupsOf, isDrawn } from "../../../lib/company/sources";
import type {
	CompletedSections,
	Figure,
	MastheadSection,
	Nullable,
	ValuationSection,
} from "../../../lib/company/types";
import {
	type RatioRange,
	ratioRanges,
	ratioScale,
} from "../../../lib/company/valuationRatios";
import {
	type YieldTable,
	yieldTable,
} from "../../../lib/company/valuationYields";
import type { Ticker } from "../../../lib/domain/ticker";
import { FigureCell } from "./FigureCell";
import { BarChart } from "./StatementChart";

/**
 * The Valuation tab of the company page (DESIGN.md §8 "Valuation"). It loads
 * the masthead, the financials and the valuation section, and shows cards
 * 3.1, 3.2 and 3.3, then the sources index.
 */
export function ValuationTab({ ticker }: { ticker: Ticker }) {
	const masthead = useCompany(ticker, "masthead");
	const financials = useCompany(ticker, "financials");
	const valuation = useCompany(ticker, "valuation");

	if (
		[masthead, financials, valuation].some(
			(state) => state.status === "loading",
		)
	) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" label="Loading valuation" />
			</div>
		);
	}
	if (
		masthead.status !== "loaded" ||
		financials.status !== "loaded" ||
		valuation.status !== "loaded"
	) {
		return (
			<Text font="sans" size="lg" className="text-left">
				The valuation figures did not load. Try again in a moment.
			</Text>
		);
	}
	return (
		<LoadedValuation
			masthead={masthead.data}
			financials={financials.sections}
			valuation={valuation.data}
		/>
	);
}

/** Cards 3.1, 3.2 and 3.3 of the loaded tab, then the sources index. */
function LoadedValuation(props: {
	masthead: MastheadSection;
	financials: CompletedSections;
	valuation: ValuationSection;
}) {
	const { masthead, financials, valuation } = props;
	// The same `sections` on each render keeps the memos below.
	const sections = React.useMemo<CompletedSections>(
		() => ({ ...financials, masthead, valuation }),
		[masthead, financials, valuation],
	);
	const ranges = React.useMemo(() => ratioRanges(sections), [sections]);
	const yields = React.useMemo(() => yieldTable(sections), [sections]);
	const groups = React.useMemo(
		() =>
			figureGroupsOf("valuation", sections).filter(({ ref }) => isDrawn(ref)),
		[sections],
	);
	const [yieldData, setYieldData] = React.useState(false);
	return (
		<div className="flex flex-col gap-10">
			<CompanyCardGrid>
				<CompanyCard
					tab="valuation"
					position={1}
					span={2}
					title="Ratios Against Their Own Ten Years and the Sector"
					caption="Now, the last ten fiscal year ends and the sector's quartiles. Multiples, from 10-K filings and daily prices."
				>
					<ul className="flex flex-col gap-6">
						{ranges.map((range) => (
							<RatioRow key={range.ratio} range={range} />
						))}
					</ul>
				</CompanyCard>
				<CompanyCard
					tab="valuation"
					position={2}
					span={2}
					className="min-w-0"
					title="Earnings Yield and FCF Yield Next to the 10-Year Treasury"
					caption="Each fiscal year end and now. Percent, from 10-K filings, daily prices and Treasury par yields."
					actions={
						<ChartActions
							data={yieldData}
							onData={setYieldData}
							claims={
								groups.find(({ ref }) => ref.block === "yieldsAgainstTreasury")
									?.claims ?? []
							}
						/>
					}
				>
					{yieldData ? (
						<YieldGrid table={yields} />
					) : (
						<BarChart table={yields} format={formatInput} />
					)}
				</CompanyCard>
				<CompanyCard
					tab="valuation"
					position={3}
					span={2}
					className="min-w-0"
					title="How the Ratios Are Built"
					caption="Each ratio now, with its formula and the figures it divides."
				>
					<Table
						aria-label="How the Ratios Are Built table"
						className="text-base"
					>
						<TableHeader>
							<TableRow>
								<TableHead className={FIXED_COLUMN}>Ratio</TableHead>
								<TableHead>Formula</TableHead>
								<TableHead>Inputs</TableHead>
								<TableHead className="text-right">Now</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{ranges.map(({ ratio, now }) => (
								<TableRow key={ratio}>
									<TableHead scope="row" className={FIXED_COLUMN}>
										{metrics[ratio].name}
									</TableHead>
									<TableCell>{metrics[ratio].formula}</TableCell>
									<TableCell>
										<Inputs inputs={metricInputsOf(ratio, sections)} />
									</TableCell>
									<TableCell className="text-right">
										<Value figure={now} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CompanyCard>
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/**
 * The table behind the "Data" button of card 3.2: one row per yield, one
 * column per fiscal year end and a last column for now. A missing yield
 * shows the dimmed dash.
 */
function YieldGrid({ table }: { table: YieldTable }) {
	return (
		<Table
			aria-label="Earnings Yield and FCF Yield Next to the 10-Year Treasury table"
			className="text-base"
		>
			<TableHeader>
				<TableRow>
					<TableHead className={FIXED_COLUMN}>Yield</TableHead>
					{table.columns.map(({ key, label }) => (
						<TableHead key={key} className="text-right">
							{label}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{table.lines.map((line) => (
					<TableRow key={line.key}>
						<TableHead scope="row" className={FIXED_COLUMN}>
							{line.label}
						</TableHead>
						{line.points.map((point, position) => (
							<FigureCell
								key={table.columns[position]?.key ?? position}
								figure={point}
							/>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

/** One ratio: its figure now, then a bar of its own ten years and a bar of the sector. */
function RatioRow({ range }: { range: RatioRange }) {
	const { sector } = range;
	const scale = ratioScale(range);
	return (
		<li className="grid gap-2 md:grid-cols-[8rem_1fr] md:gap-4">
			<div className="flex items-baseline justify-between gap-2 md:flex-col md:justify-start">
				<span className="font-medium">{metrics[range.ratio].name}</span>
				<Value figure={range.now} />
			</div>
			<div className="flex flex-col gap-3">
				<RangeRow
					label={{ short: "Own", long: "Own 10 years" }}
					band="bg-chart-2"
					figures={[range.ownLow, range.ownMedian, range.ownHigh]}
					now={range.now}
					scale={scale}
				/>
				<RangeRow
					label={{ short: "Sector", long: "Sector quartiles" }}
					band="bg-chart-4"
					figures={
						sector
							? [sector.lowerQuartile, sector.median, sector.upperQuartile]
							: [null, null, null]
					}
					now={range.now}
					scale={scale}
				/>
			</div>
		</li>
	);
}

/**
 * One range bar: the range as a band, the median as a tick and the figure now
 * as a dot, with the low, the median and the high printed below. `label`
 * holds the short phone label and the long desktop label. With no `scale`,
 * no figure is known, so nothing draws.
 */
function RangeRow(props: {
	label: { short: string; long: string };
	band: string;
	figures: [Figure, Figure, Figure];
	now: Figure;
	scale: Nullable<[number, number]>;
}) {
	const [low, median, high] = props.figures;
	const at = (figure: Figure) =>
		figure &&
		props.scale &&
		rangeBarPosition(Number(figure.value), ...props.scale)?.percent;
	const [left, right] = [at(low), at(high)];
	const ranged = left != null && right != null;
	const marks = [
		[at(median), "top-0 h-3 w-0.5 bg-foreground"],
		[ranged && at(props.now), "top-0.5 size-2.5 rounded-full bg-primary"],
	] as const;
	return (
		<div className="grid grid-cols-[4rem_1fr] items-start gap-3 md:grid-cols-[8rem_1fr]">
			<span className="text-sm text-muted-foreground">
				<span className="md:hidden">{props.label.short}</span>
				<span className="hidden md:inline">{props.label.long}</span>
			</span>
			<div className="flex flex-col gap-1">
				<div className="relative h-3" aria-hidden="true">
					<div className="absolute inset-x-0 top-1/2 h-px bg-border" />
					{ranged && (
						<div
							className={cn("absolute top-0.75 h-1.5 rounded-full", props.band)}
							style={{ left: `${left}%`, width: `${right - left}%` }}
						/>
					)}
					{marks.map(
						([position, mark]) =>
							typeof position === "number" && (
								<div
									key={mark}
									className={cn("absolute -translate-x-1/2", mark)}
									style={{ left: `${position}%` }}
								/>
							),
					)}
				</div>
				<div className="flex justify-between gap-2 text-sm">
					<Value figure={low} />
					<span>
						<span className="text-muted-foreground">median </span>
						<Value figure={median} />
					</span>
					<Value figure={high} />
				</div>
			</div>
		</div>
	);
}

/** A ratio as the page prints it, with its sources, or the dimmed dash when it is missing. */
function Value({ figure }: { figure: Figure }) {
	return figure === null || typeof figure.value !== "number" ? (
		<span className={cn("font-monospace", MISSING_INK)}>{MISSING}</span>
	) : (
		<SourceTrigger claim={figure} className="font-monospace">
			{formatNumber(Number(figure.value))}
		</SourceTrigger>
	);
}

/**
 * The inputs of a ratio, each with its sources. An input that is missing
 * shows the dimmed dash. A ratio that fails its guard still shows its inputs.
 */
function Inputs({ inputs }: { inputs: readonly Figure[] }) {
	return (
		<ul className="flex flex-col gap-1">
			{inputs.map((input, index) => (
				<li key={input?.id ?? index}>
					{input === null ? (
						<Value figure={null} />
					) : (
						<>
							<span className="text-muted-foreground">{input.label} </span>
							<SourceTrigger claim={input} className="font-monospace">
								{formatInput(input)}
							</SourceTrigger>
						</>
					)}
				</li>
			))}
		</ul>
	);
}
