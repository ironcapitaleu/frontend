import * as React from "react";

import { ChartActions } from "@/components/company/ChartActions";
import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import { FIXED_COLUMN, formatInput } from "@/components/company/format";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { useCompany } from "../../../hooks/useCompany";
import { figureGroupsOf } from "../../../lib/company/sources";
import type {
	BlockKey,
	Claim,
	CompletedSections,
	Series,
	Unit,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { FigureCell } from "./FigureCell";
import type { BarTable } from "./financialsTable";
import { BarChart } from "./StatementChart";

/** The blocks this tab draws. The Sources index names only these. */
const DRAWN_BLOCKS: ReadonlySet<BlockKey> = new Set(["dividendPerShare"]);

/**
 * The Shareholder returns tab of the company page (DESIGN.md §8 "Shareholder
 * returns"). It loads the Shareholder returns section and shows card 4.1,
 * then the sources index.
 */
export function ShareholderReturnsTab({ ticker }: { ticker: Ticker }) {
	const returns = useCompany(ticker, "shareholderReturns");

	if (returns.status === "loading") {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" label="Loading shareholder returns" />
			</div>
		);
	}
	if (returns.status !== "loaded") {
		return (
			<Text font="sans" size="lg" className="text-left">
				The shareholder returns figures did not load. Try again in a moment.
			</Text>
		);
	}
	return <LoadedReturns sections={returns.sections} />;
}

/** Card 4.1 of the loaded tab, then the sources index. */
function LoadedReturns({ sections }: { sections: CompletedSections }) {
	const groups = React.useMemo(
		() =>
			figureGroupsOf("shareholderReturns", sections).filter(({ ref }) =>
				DRAWN_BLOCKS.has(ref.block),
			),
		[sections],
	);
	const claimsOf = (block: BlockKey) =>
		groups.find(({ ref }) => ref.block === block)?.claims ?? [];
	const perShare = sections.shareholderReturns?.dividendPerShare;
	return (
		<div className="flex flex-col gap-10">
			<CompanyCardGrid>
				{perShare && (
					<ChartCard
						position={1}
						title="Dividend per Share"
						caption="Last ten fiscal years · USD per share · Form 10-K"
						unit="usdPerShare"
						series={perShare}
						claims={claimsOf("dividendPerShare")}
					/>
				)}
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/**
 * A one-line chart card of the tab. It takes one column of the grid on a
 * desktop. The "Data" button swaps the chart for a table of the same
 * figures. A series with no figure above 0 means the company paid no
 * dividend, so one line takes the place of the chart.
 */
function ChartCard(props: {
	position: number;
	title: string;
	caption: string;
	unit: Unit;
	series: Series;
	claims: readonly Claim[];
}) {
	const [data, setData] = React.useState(false);
	const { series, title, unit } = props;
	const table: BarTable = {
		columns: series.periods.map((period) => ({
			key: period.endsOn,
			label: `FY${period.fiscalYear}`,
			short: `FY${String(period.fiscalYear).slice(-2)}`,
		})),
		lines: [series],
	};
	const paysDividend = series.points.some(
		(point) => typeof point?.value === "number" && point.value > 0,
	);
	return (
		<CompanyCard
			tab="shareholderReturns"
			position={props.position}
			title={title}
			caption={props.caption}
			className="min-w-0"
			actions={
				<ChartActions data={data} onData={setData} claims={props.claims} />
			}
		>
			{data ? (
				<Table aria-label={`${title} table`} className="text-base">
					<TableHeader>
						<TableRow>
							<TableHead className={FIXED_COLUMN}>Fiscal year</TableHead>
							<TableHead className="text-right">{series.label}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{table.columns.map((column, index) => (
							<TableRow key={column.key}>
								<TableHead scope="row" className={FIXED_COLUMN}>
									{column.label}
								</TableHead>
								<FigureCell
									figure={series.points[index] ?? null}
									format={(value) => formatInput({ value, unit })}
								/>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : paysDividend ? (
				<BarChart table={table} format={formatInput} />
			) : (
				<p className="text-base text-muted-foreground">
					The company paid no dividend in these fiscal years.
				</p>
			)}
		</CompanyCard>
	);
}
