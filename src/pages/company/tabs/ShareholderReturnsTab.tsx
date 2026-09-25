import * as React from "react";

import { ChartActions } from "@/components/company/ChartActions";
import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import {
	FIXED_COLUMN,
	formatInput,
	formatShares,
} from "@/components/company/format";
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
import {
	dividendsToFreeCashFlow,
	netBuyback,
	pointInYear,
} from "../../../lib/company/metrics";
import { figureGroupsOf, isDrawn } from "../../../lib/company/sources";
import type {
	BlockKey,
	Claim,
	CompletedSections,
	Figure,
	Period,
	Series,
	ShareholderReturnsSection,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { FigureCell } from "./FigureCell";
import type { BarTable } from "./financialsTable";
import { BarChart } from "./StatementChart";

/**
 * The Shareholder returns tab of the company page (DESIGN.md §8 "Shareholder
 * returns"). It loads the financials and the Shareholder returns section, and
 * shows cards 4.1 and 4.2 side by side, card 4.3 across both columns below
 * them, then the sources index.
 */
export function ShareholderReturnsTab({ ticker }: { ticker: Ticker }) {
	const financials = useCompany(ticker, "financials");
	const returns = useCompany(ticker, "shareholderReturns");

	if (financials.status === "loading" || returns.status === "loading") {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" label="Loading shareholder returns" />
			</div>
		);
	}
	if (financials.status !== "loaded" || returns.status !== "loaded") {
		return (
			<Text font="sans" size="lg" className="text-left">
				The shareholder returns figures did not load. Try again in a moment.
			</Text>
		);
	}
	return (
		<LoadedReturns financials={financials.sections} returns={returns.data} />
	);
}

/** Cards 4.1 to 4.3 of the loaded tab, then the sources index. */
function LoadedReturns(props: {
	financials: CompletedSections;
	returns: ShareholderReturnsSection;
}) {
	const { financials, returns } = props;
	// The same `sections` on each render keeps the memo below.
	const sections = React.useMemo<CompletedSections>(
		() => ({ ...financials, shareholderReturns: returns }),
		[financials, returns],
	);
	const groups = React.useMemo(
		() =>
			figureGroupsOf("shareholderReturns", sections).filter(({ ref }) =>
				isDrawn(ref),
			),
		[sections],
	);
	const claimsOf = (block: BlockKey) =>
		groups.find(({ ref }) => ref.block === block)?.claims ?? [];
	const cashFlow = financials.financials?.cashFlow.annual;
	// A cash flow table with no dividends paid line reports no figure, so
	// card 4.2 draws its dashes, as card 4.1 does.
	const paid =
		cashFlow?.lines.find(({ key }) => key === "dividendsPaid")?.points ?? [];
	const payout = React.useMemo(
		() => dividendsToFreeCashFlow(sections),
		[sections],
	);
	return (
		<div className="flex flex-col gap-10">
			<CompanyCardGrid>
				<ChartCard
					position={1}
					title="Dividend per Share"
					caption="Last ten fiscal years · USD per share · Form 10-K"
					series={returns.dividendPerShare}
					paid={returns.dividendPerShare.points}
					claims={claimsOf("dividendPerShare")}
				/>
				{cashFlow && (
					<ChartCard
						position={2}
						title="Dividends Paid Against Free Cash Flow"
						caption="Last ten fiscal years · Percent of free cash flow · Form 10-K"
						series={payout}
						paid={paid}
						claims={claimsOf("dividendsAgainstFreeCashFlow")}
					/>
				)}
				<BuybacksCard
					returns={returns}
					claims={claimsOf("buybacksNetOfStaffShares")}
				/>
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/**
 * A one-line chart card of the tab. It takes one column of the grid on a
 * desktop. The "Data" button swaps the chart for a table of the same
 * figures. `paid` is the dividend figures the card reads. One line takes the place
 * of the chart only when `paid` reports figures and every one of them is 0
 * or less. A series with no figure at all is missing data, not a zero
 * dividend, so the chart draws its dashes.
 */
function ChartCard(props: {
	position: number;
	title: string;
	caption: string;
	series: Series;
	paid: readonly Figure[];
	claims: readonly Claim[];
}) {
	const [data, setData] = React.useState(false);
	const { series, title } = props;
	const table: BarTable = {
		columns: columnsOf(series.periods),
		lines: [series],
	};
	const reported = props.paid.flatMap((point) =>
		typeof point?.value === "number" && Number.isFinite(point.value)
			? [point.value]
			: [],
	);
	const paidNothing =
		reported.length > 0 && reported.every((value) => value <= 0);
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
				<DataTable
					title={title}
					table={table}
					format={(value) => formatInput({ value, unit: series.unit })}
				/>
			) : paidNothing ? (
				<p className="text-base text-muted-foreground">
					The company paid no dividend in these fiscal years.
				</p>
			) : (
				<BarChart table={table} format={formatInput} />
			)}
		</CompanyCard>
	);
}

/**
 * Card 4.3: the shares bought back, above zero, the shares issued to staff,
 * below zero, and the net buyback, in each fiscal year. It takes both columns
 * on a desktop. A year with no figure draws the dimmed dash, never a zero bar.
 * The "Data" table shows the same signed figures as the chart.
 */
function BuybacksCard(props: {
	returns: ShareholderReturnsSection;
	claims: readonly Claim[];
}) {
	const [data, setData] = React.useState(false);
	const { sharesRepurchased: bought, sharesIssuedToStaff: issued } =
		props.returns;
	const net = netBuyback(props.returns);
	const inYear = (series: Series) =>
		net.periods.map(({ fiscalYear }) => pointInYear(series, fiscalYear));
	const title = "Buybacks Net of Shares Issued to Staff";
	const table: BarTable = {
		columns: columnsOf(net.periods),
		lines: [
			{ key: bought.key, label: bought.label, points: inYear(bought) },
			// The chart draws the shares issued below zero. Only the drawn value
			// flips, so each bar still opens the reported claim's sources.
			{
				key: issued.key,
				label: issued.label,
				points: inYear(issued).map((point) =>
					typeof point?.value === "number"
						? { ...point, value: -point.value }
						: point,
				),
			},
			net,
		],
	};
	return (
		<CompanyCard
			tab="shareholderReturns"
			position={3}
			title={title}
			caption="Last ten fiscal years · Shares · Statement of shareholders' equity, Form 10-K"
			span={2}
			className="min-w-0"
			actions={
				<ChartActions data={data} onData={setData} claims={props.claims} />
			}
		>
			{data ? (
				<DataTable title={title} table={table} format={formatShares} />
			) : (
				<BarChart table={table} format={(claim) => formatShares(claim.value)} />
			)}
		</CompanyCard>
	);
}

/** Returns the fiscal year columns of a chart, `FY2026` in full and `FY26` short. */
function columnsOf(periods: readonly Period[]): BarTable["columns"] {
	return periods.map((period) => ({
		key: period.endsOn,
		label: `FY${period.fiscalYear}`,
		short: `FY${String(period.fiscalYear).slice(-2)}`,
	}));
}

/** The "Data" table of a card: one row for each fiscal year and one column for each line of `table`. */
function DataTable(props: {
	title: string;
	table: BarTable;
	format: (value: number) => string;
}) {
	const { table } = props;
	return (
		<Table aria-label={`${props.title} table`} className="text-base">
			<TableHeader>
				<TableRow>
					<TableHead className={FIXED_COLUMN}>Fiscal year</TableHead>
					{table.lines.map((line) => (
						<TableHead key={line.key} className="text-right">
							{line.label}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{table.columns.map((column, index) => (
					<TableRow key={column.key}>
						<TableHead scope="row" className={FIXED_COLUMN}>
							{column.label}
						</TableHead>
						{table.lines.map((line) => (
							<FigureCell
								key={line.key}
								figure={line.points[index] ?? null}
								format={props.format}
							/>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
