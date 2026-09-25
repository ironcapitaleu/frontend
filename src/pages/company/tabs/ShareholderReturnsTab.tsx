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
import {
	type BarKey,
	figureGroupsOf,
	isDrawn,
	shareholderYields,
} from "../../../lib/company/sources";
import type {
	BlockKey,
	Claim,
	CompletedSections,
	Figure,
	MastheadSection,
	Period,
	Series,
	ShareholderReturnsSection,
	StatementTable,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { FigureCell } from "./FigureCell";
import { type BarTable, chartTable } from "./financialsTable";
import { BarChart } from "./StatementChart";

/**
 * The Shareholder returns tab of the company page (DESIGN.md §8 "Shareholder
 * returns"). It loads the masthead, for the year-end prices of card 4.5, the
 * financials and the Shareholder returns section, and draws without the
 * masthead when only the masthead fails. It shows cards 4.1 and 4.2
 * side by side, card 4.3 across both columns below them, cards 4.4 and 4.5
 * side by side below that, then the sources index.
 */
export function ShareholderReturnsTab({ ticker }: { ticker: Ticker }) {
	const masthead = useCompany(ticker, "masthead");
	const financials = useCompany(ticker, "financials");
	const returns = useCompany(ticker, "shareholderReturns");

	if (
		[masthead, financials, returns].some((state) => state.status === "loading")
	) {
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
		<LoadedReturns
			masthead={masthead.status === "loaded" ? masthead.data : null}
			financials={financials.sections}
			returns={returns.data}
		/>
	);
}

/**
 * Cards 4.1 to 4.5 of the loaded tab, then the sources index. Card 4.5 needs
 * the year-end prices of the masthead, so it is left out when the masthead
 * did not load, and the other cards still draw.
 */
function LoadedReturns(props: {
	masthead: MastheadSection | null;
	financials: CompletedSections;
	returns: ShareholderReturnsSection;
}) {
	const { masthead, financials, returns } = props;
	// The same `sections` on each render keeps the memos below.
	const sections = React.useMemo<CompletedSections>(
		() => ({ ...financials, masthead, shareholderReturns: returns }),
		[masthead, financials, returns],
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
	const income = financials.financials?.income.annual;
	const shares = React.useMemo(
		() => yearlyLines(income, ["dilutedShares"], sections),
		[income, sections],
	);
	const yields = React.useMemo(
		() => yearlyLines(cashFlow, shareholderYields, sections),
		[cashFlow, sections],
	);
	return (
		<div className="flex flex-col gap-10">
			<CompanyCardGrid>
				<ChartCard
					position={1}
					title="Dividend per Share"
					caption="Last ten fiscal years · USD per share · Form 10-K"
					lines={[returns.dividendPerShare]}
					paid={returns.dividendPerShare.points}
					claims={claimsOf("dividendPerShare")}
				/>
				{cashFlow && (
					<ChartCard
						position={2}
						title="Dividends Paid Against Free Cash Flow"
						caption="Last ten fiscal years · Percent of free cash flow · Form 10-K"
						lines={[payout]}
						paid={paid}
						claims={claimsOf("dividendsAgainstFreeCashFlow")}
					/>
				)}
				<BuybacksCard
					returns={returns}
					claims={claimsOf("buybacksNetOfStaffShares")}
				/>
				<ChartCard
					position={4}
					title="Share Count Over Ten Years"
					caption="Last ten fiscal years · Diluted shares · Form 10-K"
					lines={shares}
					claims={claimsOf("shareCount")}
				/>
				{masthead && (
					<ChartCard
						position={5}
						title="Total Shareholder Yield"
						caption="Last ten fiscal years · Percent of market cap at fiscal year end · 10-K filings and daily prices"
						lines={yields}
						stacked
						claims={claimsOf("totalShareholderYield")}
					/>
				)}
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/**
 * A chart card of the tab that takes one column of the grid on a desktop.
 * Each of `lines` is one bar of each fiscal year, or one part of it with
 * `stacked`, and the lines share the periods and the unit of the first. The
 * "Data" button swaps the chart for a table of the same figures. `paid` is
 * the dividend figures a dividend card reads. One line takes the place of the
 * chart only when `paid` reports figures and every one of them is 0 or less.
 * A series with no figure at all is missing data, not a zero dividend, so
 * the chart draws its dashes.
 */
function ChartCard(props: {
	position: number;
	title: string;
	caption: string;
	lines: readonly Series[];
	stacked?: boolean;
	paid?: readonly Figure[];
	claims: readonly Claim[];
}) {
	const [data, setData] = React.useState(false);
	const { lines, title } = props;
	const [first] = lines;
	const table: BarTable = { columns: columnsOf(first?.periods ?? []), lines };
	const reported = (props.paid ?? []).flatMap((point) =>
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
					format={(value) =>
						formatInput({ value, unit: first?.unit ?? "shares" })
					}
				/>
			) : paidNothing ? (
				<p className="text-base text-muted-foreground">
					The company paid no dividend in these fiscal years.
				</p>
			) : (
				<BarChart table={table} format={formatInput} stacked={props.stacked} />
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

/**
 * Returns the rows `keys` of `table` from `chartTable`, each read back at the
 * fiscal years of `table` by the point's own period, so no figure pairs with
 * another year by its position. Returns no row until `table` loads.
 */
function yearlyLines(
	table: StatementTable | undefined,
	keys: readonly BarKey[],
	sections: CompletedSections,
): Series[] {
	if (table === undefined) return [];
	return chartTable(table, keys, sections).lines.map((line) => ({
		...line,
		periods: table.periods,
		points: table.periods.map(({ fiscalYear }) =>
			pointInYear(line, fiscalYear),
		),
	}));
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
