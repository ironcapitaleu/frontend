import { useMemo, useState } from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useCompany } from "../../../hooks/useCompany";
import { figureGroupsOf } from "../../../lib/company/sources";
import type { StatementTable } from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import {
	formatStatementValue,
	type PeriodView,
	periodLabel,
	type Scale,
	type StatementKey,
	STATEMENTS,
	tableCaption,
} from "./financialsTable";

/** The indent of a statement line, by its `level`. */
const INDENT = ["", "pl-6", "pl-10"];

/** The ink of the fixed first column, so the scrolled figures pass under it. */
const FIXED_COLUMN = "max-lg:sticky max-lg:left-0 max-lg:z-10 bg-card";

/**
 * The Financials tab of the company page (DESIGN.md §8 "Financials"). A row of
 * controls picks the statement, the annual or quarterly view and the unit.
 * The statement table card below shows the chosen table. Every cell opens the
 * sources of its figure. The tab loads the Financials section through
 * `useCompany` and shows the loading and failed states as the page does.
 */
export function FinancialsTab({ ticker }: { ticker: Ticker }) {
	const state = useCompany(ticker, "financials");
	const [statement, setStatement] = useState<StatementKey>("income");
	const [view, setView] = useState<PeriodView>("annual");
	const [scale, setScale] = useState<Scale>("billions");
	const sections = state.status === "loaded" ? state.sections : null;
	const groups = useMemo(
		() => (sections ? figureGroupsOf("financials", sections) : []),
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
			<Text font="sans" size="lg" className="text-left">
				The financial statements did not load. Something went wrong on our side.
				Try again in a moment.
			</Text>
		);
	}

	const table = state.data[statement][view];
	const label = STATEMENTS.find(({ key }) => key === statement)?.label ?? "";
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-3">
					<Switch
						label="Statement"
						value={statement}
						options={STATEMENTS}
						onChange={setStatement}
					/>
					<Switch
						label="Period"
						value={view}
						options={[
							{ key: "annual", label: "Annual" },
							{ key: "quarterly", label: "Quarterly" },
						]}
						onChange={setView}
					/>
				</div>
				<Switch
					label="Unit"
					value={scale}
					options={[
						{ key: "billions", label: "Billions" },
						{ key: "millions", label: "Millions" },
					]}
					onChange={setScale}
				/>
			</div>
			<CompanyCardGrid>
				<CompanyCard
					tab="financials"
					position={2}
					title={toTitle(label)}
					caption={tableCaption(table, view, scale)}
					span={2}
					className="min-w-0"
				>
					<StatementGrid table={table} scale={scale} label={label} />
				</CompanyCard>
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/** Writes a statement name in title case, such as `Income Statement`. */
function toTitle(label: string): string {
	return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** A switch of the control row. It keeps one option pressed at all times. */
function Switch<K extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: K;
	options: readonly { key: K; label: string }[];
	onChange: (value: K) => void;
}) {
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
 * The statement table: one row per line and one column per period. Below
 * 1024 px, a table wider than its card scrolls sideways and the line names
 * stay fixed.
 */
function StatementGrid({
	table,
	scale,
	label,
}: {
	table: StatementTable;
	scale: Scale;
	label: string;
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
				</TableRow>
			</TableHeader>
			<TableBody>
				{table.lines.map((line) => (
					<TableRow key={line.key}>
						<TableHead
							scope="row"
							className={cn(FIXED_COLUMN, INDENT[line.level] ?? INDENT[2])}
						>
							{line.label}
						</TableHead>
						{line.points.map((point, position) => (
							<TableCell
								key={table.periods[position]?.endsOn ?? position}
								className="text-right font-monospace"
							>
								{point === null ? (
									<span className={MISSING_INK}>{MISSING}</span>
								) : (
									<SourceTrigger claim={point}>
										{formatStatementValue(point, scale)}
									</SourceTrigger>
								)}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
