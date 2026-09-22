import { ArrowDown, ArrowUp } from "lucide-react";
import type * as React from "react";

import { RangeBar } from "@/components/ui/range-bar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortConfig, Stock } from "@/pages/public/StockScreener.logic";

import {
	CHANGE_TONE_CLASS,
	MISSING,
	changeTone,
	formatMarketCap,
	formatNumber,
	formatPercent,
	formatPrice,
	formatSignedPercent,
} from "./format";

/** A sortable number column: its header, its group, and how a cell reads. */
interface NumberColumn {
	readonly field: keyof Stock;
	readonly label: string;
	/** Starts a new column group, so the column draws a hairline on its left. */
	readonly startsGroup?: boolean;
	readonly format: (stock: Stock) => string;
	readonly toneOf?: (stock: Stock) => string;
}

const NUMBER_COLUMNS: readonly NumberColumn[] = [
	{
		field: "marketCap",
		label: "Mkt cap",
		startsGroup: true,
		format: (stock) => formatMarketCap(stock.marketCap),
	},
	{ field: "peRatio", label: "P/E", format: (s) => formatNumber(s.peRatio) },
	{
		field: "priceToFcf",
		label: "P/FCF",
		format: (stock) => formatNumber(stock.priceToFcf),
	},
	{
		field: "priceToCash",
		label: "P/Cash",
		format: (stock) => formatNumber(stock.priceToCash),
	},
	{
		field: "quickRatio",
		label: "Quick",
		startsGroup: true,
		format: (stock) => formatNumber(stock.quickRatio, 2),
	},
	{
		field: "currentRatio",
		label: "Current",
		format: (stock) => formatNumber(stock.currentRatio, 2),
	},
	{
		field: "dividendYield",
		label: "Dividend",
		startsGroup: true,
		format: (stock) => formatPercent(stock.dividendYield),
	},
	{
		field: "buybackYield",
		label: "Buyback",
		format: (stock) => formatPercent(stock.buybackYield),
	},
	{
		field: "price",
		label: "Price",
		startsGroup: true,
		format: (stock) => formatPrice(stock.price),
	},
	{
		field: "changePercent1M",
		label: "1M",
		format: (stock) => formatSignedPercent(stock.changePercent1M),
		toneOf: (stock) => CHANGE_TONE_CLASS[changeTone(stock.changePercent1M)],
	},
];

/** The group header row: a label and how many columns it spans. */
const COLUMN_GROUPS = [
	{ label: "", span: 1 },
	{ label: "Valuation", span: 4 },
	{ label: "Balance sheet", span: 2 },
	{ label: "Shareholder yield", span: 2 },
	{ label: "Price", span: 3 },
] as const;

const COLUMN_COUNT = 2 + NUMBER_COLUMNS.length;

interface ScreenerTableProps
	extends Omit<React.ComponentProps<"div">, "onSelect" | "children"> {
	/** The rows, already filtered and sorted. */
	stocks: readonly Stock[];
	/** The active sort, or `null` for the input order. */
	sortConfig: SortConfig | null;
	/** Called when the reader activates a column header. */
	onSort: (field: keyof Stock) => void;
	/** The symbol of the row whose preview is open, if any. */
	selectedSymbol?: string | null;
	/** Called with a row's symbol when the reader selects the row. */
	onSelect: (symbol: string) => void;
}

/**
 * The screener's results table. Its columns sit in groups (Valuation, Balance
 * sheet, Shareholder yield, Price), so the reader compares each block as a
 * unit. Numbers are right-aligned in mono, and a missing value reads as a
 * dimmed `—`. The last column is a `RangeBar` for the 52-week range.
 *
 * Each number header sorts its column (ascending, descending, off) and carries
 * `aria-sort`. The sorted column takes a light `muted` tint. A row is selected
 * by a click anywhere on it, or with Enter on the company button. The selected
 * row carries a thin accent mark on its left edge. Below the desktop width the
 * table scrolls sideways inside its frame.
 */
function ScreenerTable({
	stocks,
	sortConfig,
	onSort,
	selectedSymbol = null,
	onSelect,
	className,
	...props
}: ScreenerTableProps) {
	const isSorted = (field: keyof Stock) => sortConfig?.field === field;

	return (
		<div
			data-slot="screener-table"
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card",
				className,
			)}
			{...props}
		>
			<Table className="min-w-[60rem] text-base">
				<TableHeader className="bg-muted/60">
					<TableRow className="border-0 hover:bg-transparent">
						{COLUMN_GROUPS.map((group, index) => (
							<th
								key={group.label || "company"}
								colSpan={group.span}
								scope="colgroup"
								className={cn(
									"px-2 pt-2.5 text-left text-xs font-medium tracking-widest text-muted-foreground uppercase first:px-4",
									index > 0 && "border-l border-border",
								)}
							>
								{group.label}
							</th>
						))}
					</TableRow>
					<TableRow className="hover:bg-transparent">
						<TableHead scope="col" className="w-52 px-4 text-muted-foreground">
							Company
						</TableHead>
						{NUMBER_COLUMNS.map((column) => (
							<SortableHead
								key={column.field}
								column={column}
								sortConfig={sortConfig}
								onSort={onSort}
							/>
						))}
						<TableHead
							scope="col"
							className="w-40 pr-4 pl-3 text-muted-foreground"
						>
							52-week range
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stocks.length === 0 ? (
						<TableRow className="hover:bg-transparent">
							<TableCell
								colSpan={COLUMN_COUNT}
								className="py-16 text-center text-lg text-muted-foreground"
							>
								No companies match these filters.
							</TableCell>
						</TableRow>
					) : (
						stocks.map((stock) => (
							<TableRow
								key={stock.symbol}
								data-state={
									stock.symbol === selectedSymbol ? "selected" : undefined
								}
								// The company button gives keyboard access. The row click is a
								// larger mouse target for the same action.
								onClick={() => onSelect(stock.symbol)}
								className="cursor-pointer data-[state=selected]:bg-muted/70 data-[state=selected]:shadow-[inset_3px_0_0_var(--color-chart-3)]"
							>
								<TableCell className="px-4 py-2.5">
									<button
										type="button"
										aria-haspopup="dialog"
										onClick={(event) => {
											event.stopPropagation();
											onSelect(stock.symbol);
										}}
										className="flex max-w-48 cursor-pointer flex-col items-start gap-0.5 rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
									>
										<span className="font-monospace text-lg font-medium">
											{stock.symbol}
										</span>
										<span className="max-w-full truncate text-muted-foreground">
											{stock.name} · {stock.country}
										</span>
									</button>
								</TableCell>
								{NUMBER_COLUMNS.map((column) => {
									const text = column.format(stock);
									return (
										<TableCell
											key={column.field}
											className={cn(
												"text-right font-monospace",
												column.startsGroup && "border-l border-border",
												isSorted(column.field) && "bg-muted/60",
												text === MISSING
													? "text-muted-foreground/60"
													: column.toneOf?.(stock),
											)}
										>
											{text}
										</TableCell>
									);
								})}
								<TableCell className="pr-4 pl-3">
									<RangeBar
										aria-label={`${stock.symbol} 52-week range`}
										value={stock.price}
										low={stock.weekLow52}
										high={stock.weekHigh52}
									/>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

/** A number column header that sorts on activation and reports `aria-sort`. */
function SortableHead({
	column,
	sortConfig,
	onSort,
}: {
	column: NumberColumn;
	sortConfig: SortConfig | null;
	onSort: (field: keyof Stock) => void;
}) {
	const direction =
		sortConfig?.field === column.field ? sortConfig.direction : null;

	return (
		<TableHead
			scope="col"
			aria-sort={
				direction === "asc"
					? "ascending"
					: direction === "desc"
						? "descending"
						: undefined
			}
			className={cn(
				"px-2 text-right",
				column.startsGroup && "border-l border-border",
				direction && "bg-muted/60",
			)}
		>
			<button
				type="button"
				onClick={() => onSort(column.field)}
				className={cn(
					"inline-flex cursor-pointer items-center gap-1 rounded-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
					direction
						? "text-foreground"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				{column.label}
				{direction === "asc" ? (
					<ArrowUp className="size-3" aria-hidden="true" />
				) : direction === "desc" ? (
					<ArrowDown className="size-3" aria-hidden="true" />
				) : null}
			</button>
		</TableHead>
	);
}

export { ScreenerTable, type ScreenerTableProps };
