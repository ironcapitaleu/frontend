import { useMemo, useState } from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import { ChartActions } from "@/components/company/ChartActions";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import { FIXED_COLUMN } from "@/components/company/format";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import { Heading } from "@/components/ui/heading";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCompany } from "@/hooks/useCompany";
import { usePhone } from "@/hooks/usePhone";
import { growthPerYear } from "@/lib/company/metrics";
import { chartLines, figureGroupsOf } from "@/lib/company/sources";
import type { BlockKey, Figure } from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import { cn } from "@/lib/utils";
import {
	chartTable,
	formatStatementValue,
	lineUnitNote,
	newestFirst,
	type PeriodView,
	periodLabel,
	type RowTable,
	type Scale,
	type StatementKey,
	STATEMENTS,
	tableCaption,
	toTitle,
	withMargins,
} from "./financialsTable";
import { StatementChart } from "./StatementChart";

/** The indent of a statement line, by its `level`. */
const INDENT = ["", "pl-6", "pl-10"];

/**
 * The blocks this tab draws: the three charts and the three statement
 * tables. The Sources index names only these.
 */
const DRAWN_BLOCKS: ReadonlySet<BlockKey> = new Set([
	"incomeChart",
	"balanceChart",
	"cashFlowChart",
	"incomeTable",
	"balanceTable",
	"cashFlowTable",
]);

const PERIOD_VIEWS: readonly { key: PeriodView; label: string }[] = [
	{ key: "annual", label: "Annual" },
	{ key: "quarterly", label: "Quarterly" },
];

const UNITS: readonly { key: Scale; label: string }[] = [
	{ key: "billions", label: "Billions" },
	{ key: "millions", label: "Millions" },
];

/**
 * The Financials tab of the company page (DESIGN.md §8 "Financials"). A row of
 * controls picks the statement, the annual or quarterly view and the unit.
 * The chart card draws the statement's fiscal years, and its "Data" button
 * swaps the chart for a table. The statement table card below shows the
 * chosen table, and in the annual view a last column of growth per year
 * (CAGR). Operating margin and net margin sit as muted rows under the
 * line each divides. Every cell and every bar opens the sources of its figure. On a
 * phone, the statement and period switches are select menus and the table
 * shows the newest period first. The tab loads the Financials section through
 * `useCompany`. It shows the page's spinner while
 * it loads and, when the load fails, the page's failed copy in the panel.
 */
export function FinancialsTab({ ticker }: { ticker: Ticker }) {
	const state = useCompany(ticker, "financials");
	const [statement, setStatement] = useState<StatementKey>("income");
	const [view, setView] = useState<PeriodView>("annual");
	const [scale, setScale] = useState<Scale>("billions");
	const [data, setData] = useState(false);
	const phone = usePhone();
	const sections = state.status === "loaded" ? state.sections : null;
	const groups = useMemo(
		() =>
			sections
				? figureGroupsOf("financials", sections).filter(({ ref }) =>
						DRAWN_BLOCKS.has(ref.block),
					)
				: [],
		[sections],
	);

	if (state.status === "loading") {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" label="Loading financials" />
			</div>
		);
	}
	if (state.status !== "loaded") {
		return (
			<section className="flex flex-col items-center text-center py-16">
				<Heading level={2} variant="hero" className="mb-4 text-3xl">
					The financial statements did not load.
				</Heading>
				<Text font="sans" size="lg">
					Something went wrong on our side. Try again in a moment.
				</Text>
			</section>
		);
	}

	const shown = withMargins(state.data[statement][view]);
	const table = phone ? newestFirst(shown) : shown;
	const label = STATEMENTS.find(({ key }) => key === statement)?.label ?? "";
	const chart = chartTable(
		state.data[statement].annual,
		chartLines[statement],
		state.sections,
	);
	const chartClaims =
		groups.find(({ ref }) => ref.block === `${statement}Chart`)?.claims ?? [];
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-3">
					<ControlSwitch
						label="Statement"
						value={statement}
						options={STATEMENTS}
						onChange={setStatement}
						menu={phone}
					/>
					<ControlSwitch
						label="Period"
						value={view}
						options={PERIOD_VIEWS}
						onChange={setView}
						menu={phone}
					/>
				</div>
				<ControlSwitch
					label="Unit"
					value={scale}
					options={UNITS}
					onChange={setScale}
				/>
			</div>
			<CompanyCardGrid>
				<CompanyCard
					tab="financials"
					position={1}
					title={`${toTitle(label)} Chart`}
					caption={tableCaption(chart, "annual", scale)}
					span={2}
					className="min-w-0"
					actions={
						<ChartActions data={data} onData={setData} claims={chartClaims} />
					}
				>
					{data ? (
						<StatementGrid
							table={phone ? newestFirst(chart) : chart}
							scale={scale}
							label={`${label} chart`}
						/>
					) : (
						<StatementChart table={chart} scale={scale} />
					)}
				</CompanyCard>
				<CompanyCard
					tab="financials"
					position={2}
					title={toTitle(label)}
					caption={tableCaption(shown, view, scale)}
					span={2}
					className="min-w-0"
				>
					<StatementGrid
						table={table}
						scale={scale}
						label={label}
						growth={view === "annual"}
					/>
				</CompanyCard>
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/**
 * A switch of the control row. It keeps one option pressed at all times. With
 * `menu`, it is a select menu, the form a phone gives it.
 */
function ControlSwitch<K extends string>({
	label,
	value,
	options,
	onChange,
	menu = false,
}: {
	label: string;
	value: K;
	options: readonly { key: K; label: string }[];
	onChange: (value: K) => void;
	menu?: boolean;
}) {
	if (menu) {
		return (
			<Select
				value={value}
				onValueChange={(next) => {
					const picked = options.find(({ key }) => key === next);
					if (picked) onChange(picked.key);
				}}
			>
				<SelectTrigger aria-label={label}>
					<SelectValue>
						{(current: string) =>
							options.find(({ key }) => key === current)?.label
						}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.key} value={option.key}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	}
	return (
		<ToggleGroup
			aria-label={label}
			variant="outline"
			size="sm"
			className="flex-wrap"
			value={[value]}
			onValueChange={(next) => {
				const picked = options.find(({ key }) => key === next[0]);
				if (picked) onChange(picked.key);
			}}
		>
			{options.map((option) => (
				<ToggleGroupItem
					key={option.key}
					value={option.key}
					className="data-pressed:bg-foreground data-pressed:text-background"
				>
					{option.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

/**
 * The statement table: one row per line and one column per period. With
 * `growth`, a last column shows each line's growth per year, and an empty
 * cell for a margin row. A margin row is muted. Below 1024 px,
 * a table wider than its card scrolls sideways and the line names stay fixed.
 */
function StatementGrid({
	table,
	scale,
	label,
	growth = false,
}: {
	table: RowTable;
	scale: Scale;
	label: string;
	growth?: boolean;
}) {
	return (
		<Table aria-label={`${label} table`} className="text-base">
			<TableHeader>
				<TableRow>
					<TableHead className={FIXED_COLUMN}>Line</TableHead>
					{table.periods.map((period) => (
						<TableHead key={period.endsOn} className="text-right">
							{periodLabel(period)}
						</TableHead>
					))}
					{growth && <TableHead className="text-right">CAGR</TableHead>}
				</TableRow>
			</TableHeader>
			<TableBody>
				{table.lines.map((line) => (
					<TableRow
						key={line.key}
						className={cn(line.margin && "text-muted-foreground")}
					>
						<TableHead
							scope="row"
							className={cn(
								FIXED_COLUMN,
								INDENT[line.level] ?? INDENT[2],
								line.margin && "font-normal text-muted-foreground",
							)}
						>
							{line.label}
							<UnitNote note={lineUnitNote(line.unit, scale)} />
						</TableHead>
						{line.points.map((point, position) => (
							<FigureCell
								key={table.periods[position]?.endsOn ?? position}
								figure={point}
								scale={scale}
							/>
						))}
						{growth &&
							(line.margin ? (
								<TableCell />
							) : (
								<FigureCell figure={growthPerYear(line)} scale={scale} />
							))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

/** One figure of the table, or the dimmed dash when it is missing. */
function FigureCell({ figure, scale }: { figure: Figure; scale: Scale }) {
	return (
		<TableCell className="text-right font-monospace">
			{figure === null ? (
				<span className={MISSING_INK}>{MISSING}</span>
			) : (
				<SourceTrigger claim={figure}>
					{formatStatementValue(figure, scale)}
				</SourceTrigger>
			)}
		</TableCell>
	);
}

/** The muted unit of a line whose figures do not read in the caption's unit. */
function UnitNote({ note }: { note: string | null }) {
	if (note === null) return null;
	return (
		<span className="ml-1 font-normal text-muted-foreground">({note})</span>
	);
}
