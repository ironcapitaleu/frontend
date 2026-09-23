import { useMemo, useState } from "react";

import { SlidersHorizontal } from "lucide-react";

import { CompanyPreview } from "@/components/screener/CompanyPreview";
import { METRICS, type MetricField } from "@/components/screener/format";
import { ScreenerFilterRail } from "@/components/screener/ScreenerFilterRail";
import { ScreenerResultCard } from "@/components/screener/ScreenerResultCard";
import { ScreenerSummary } from "@/components/screener/ScreenerSummary";
import { NO_MATCHES, ScreenerTable } from "@/components/screener/ScreenerTable";
import {
	EMPTY_FILTERS,
	type FilterState,
	STRATEGY_PRESETS,
	type SortConfig,
	type Stock,
	applyPreset,
	countActiveFilters,
	describeActiveFilters,
	filterStocks,
	findActivePreset,
	nextSortConfig,
	railFilters,
	sortStocks,
} from "@/components/screener/screener.logic";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { SAMPLE_STOCKS } from "./StockScreener.sample";

/** Names for the sortable columns that are not key figures. */
const SORT_NAMES: Partial<Record<keyof Stock, string>> = {
	price: "Price",
	changePercent1M: "1M change",
};

/** The sort choices on a phone, where the table headers are not visible. */
const MOBILE_SORTS: readonly { label: string; sort: SortConfig | null }[] = [
	{ label: "Default order", sort: null },
	{
		label: "Dividend, highest first",
		sort: { field: "dividendYield", direction: "desc" },
	},
	{
		label: "Buyback, highest first",
		sort: { field: "buybackYield", direction: "desc" },
	},
	{ label: "P/E, lowest first", sort: { field: "peRatio", direction: "asc" } },
	{
		label: "P/FCF, lowest first",
		sort: { field: "priceToFcf", direction: "asc" },
	},
	{
		label: "1M change, lowest first",
		sort: { field: "changePercent1M", direction: "asc" },
	},
	{
		label: "Market cap, highest first",
		sort: { field: "marketCap", direction: "desc" },
	},
];

interface StockScreenerProps {
	/**
	 * The universe to screen. Defaults to the built-in {@link SAMPLE_STOCKS}
	 * placeholder. A real data source, or a test's fake dataset, is passed in so
	 * the screener's behaviour stays independent of the data it happens to show.
	 */
	stocks?: readonly Stock[];
}

/**
 * The screener page. A serif masthead sits above the working tool: strategy
 * presets, a filter rail, and the results with their medians. Selecting a
 * result opens the company preview.
 *
 * From 1024 px the filter rail sits left of the results. Below it, the rail
 * moves into a sheet behind a "Filters" button. Below 768 px, the table turns
 * into a list of result cards with a sort menu. The layout is recorded in
 * DESIGN.md §7.
 */
export default function StockScreener({
	stocks = SAMPLE_STOCKS,
}: StockScreenerProps) {
	const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
	const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
	const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const results = useMemo(() => {
		const filtered = filterStocks(stocks, filters);
		return sortConfig
			? sortStocks(filtered, sortConfig.field, sortConfig.direction)
			: filtered;
	}, [stocks, filters, sortConfig]);

	const activePreset = findActivePreset(railFilters(filters));
	const chips = describeActiveFilters(filters);
	const activeCount = countActiveFilters(railFilters(filters));
	const selectedStock =
		stocks.find((stock) => stock.symbol === selectedSymbol) ?? null;

	const selectStock = (symbol: string) => {
		setSelectedSymbol(symbol);
		setPreviewOpen(true);
	};

	const rail = (
		<ScreenerFilterRail
			stocks={stocks}
			filters={filters}
			onFiltersChange={setFilters}
		/>
	);

	return (
		<div className="flex-1 bg-background">
			<div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-4 py-8 md:px-8">
				<header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
					<div className="flex flex-col gap-2">
						<h1 className="font-classic text-5xl font-medium md:text-6xl">
							The Screener
						</h1>
						<p className="max-w-[60ch] text-left text-xl text-muted-foreground">
							Start from the numbers that matter. Every company here is one
							worth understanding before acting.
						</p>
					</div>
					<SearchBar
						className="lg:max-w-md"
						placeholder="Search by ticker or company"
						aria-label="Search by ticker or company"
						value={filters.search}
						onChange={(event) =>
							setFilters((previous) => ({
								...previous,
								search: event.target.value,
							}))
						}
					/>
				</header>

				<fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0 md:flex-row md:items-center md:gap-4">
					<legend className="float-left text-sm font-medium tracking-wider text-muted-foreground uppercase max-md:sr-only">
						Strategies
					</legend>
					<div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
						{STRATEGY_PRESETS.map((preset) => {
							const isActive = activePreset?.id === preset.id;
							return (
								<button
									key={preset.id}
									type="button"
									aria-pressed={isActive}
									onClick={() =>
										setFilters((previous) => ({
											...(isActive ? EMPTY_FILTERS : applyPreset(preset)),
											search: previous.search,
										}))
									}
									className={cn(
										"btn-tactile h-9 shrink-0 rounded-full border px-4 text-lg font-medium whitespace-nowrap",
										isActive
											? "border-foreground bg-foreground text-background"
											: "border-border bg-background text-foreground",
									)}
								>
									{preset.label}
								</button>
							);
						})}
					</div>
				</fieldset>

				<div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
					<div className="hidden lg:block">{rail}</div>

					<section aria-label="Results" className="flex min-w-0 flex-col gap-4">
						<div className="flex flex-wrap items-center gap-3">
							<p aria-live="polite" className="text-lg">
								<span className="font-monospace font-medium">
									{results.length}
								</span>{" "}
								<span className="text-muted-foreground">
									of {stocks.length} companies
								</span>
							</p>
							{chips.map((chip) => (
								<FilterChip
									key={chip.field}
									label={chip.label}
									value={chip.value}
									onRemove={() =>
										setFilters((previous) => ({
											...previous,
											[chip.field]: EMPTY_FILTERS[chip.field],
										}))
									}
								/>
							))}
							<div className="ml-auto flex items-center gap-2">
								<MobileSortSelect
									sortConfig={sortConfig}
									onSortChange={setSortConfig}
								/>
								<Button
									variant="outline"
									aria-haspopup="dialog"
									aria-expanded={filtersOpen}
									className="btn-tactile h-11 gap-2 px-3 text-lg lg:hidden"
									onClick={() => setFiltersOpen(true)}
								>
									<SlidersHorizontal aria-hidden="true" />
									Filters
									{activeCount > 0 ? (
										<span className="font-monospace">{activeCount}</span>
									) : null}
								</Button>
							</div>
						</div>

						<ScreenerSummary matched={results} universe={stocks} />

						<ScreenerTable
							className="hidden md:block"
							stocks={results}
							sortConfig={sortConfig}
							onSort={(field) =>
								setSortConfig((previous) => nextSortConfig(previous, field))
							}
							selectedSymbol={previewOpen ? selectedSymbol : null}
							onSelect={selectStock}
						/>

						<div className="md:hidden">
							{results.length === 0 ? (
								<p className="py-12 text-center text-lg text-muted-foreground">
									{NO_MATCHES}
								</p>
							) : (
								<ul aria-label="Companies" className="border-t border-border">
									{results.map((stock) => (
										<li key={stock.symbol}>
											<ScreenerResultCard
												stock={stock}
												highlightField={highlightFor(sortConfig)}
												onSelect={selectStock}
											/>
										</li>
									))}
								</ul>
							)}
						</div>

						<p className="text-base text-muted-foreground">
							Sample data. Prices in USD.
						</p>
					</section>
				</div>
			</div>

			<Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
				<SheetContent side="left">
					<SheetTitle className="sr-only">Filters</SheetTitle>
					<SheetBody className="pr-16">{rail}</SheetBody>
					<footer className="border-t border-border p-4">
						<Button
							variant="inverted"
							className="btn-tactile h-11 w-full text-lg"
							onClick={() => setFiltersOpen(false)}
						>
							Show {results.length}{" "}
							{results.length === 1 ? "company" : "companies"}
						</Button>
					</footer>
				</SheetContent>
			</Sheet>

			<CompanyPreview
				stock={selectedStock}
				filters={filters}
				open={previewOpen}
				onOpenChange={setPreviewOpen}
			/>
		</div>
	);
}

/** A stable id for a sort, used as the menu value. */
function sortId(sort: SortConfig | null): string {
	return sort ? `${sort.field}:${sort.direction}` : "default";
}

/** Names a sort that the menu does not list, such as one set from a header. */
function describeSort({ field, direction }: SortConfig): string {
	const name =
		field in METRICS
			? METRICS[field as MetricField].label
			: (SORT_NAMES[field] ?? field);
	return `${name}, ${direction === "asc" ? "lowest first" : "highest first"}`;
}

/**
 * The sort menu for the card list. The table headers sort on wider screens.
 * A sort set from a header that the menu does not list shows as its own
 * option, so the menu never claims the default order for a sorted list.
 */
function MobileSortSelect({
	sortConfig,
	onSortChange,
}: {
	sortConfig: SortConfig | null;
	onSortChange: (sort: SortConfig | null) => void;
}) {
	const listed = MOBILE_SORTS.some(
		(option) => sortId(option.sort) === sortId(sortConfig),
	);
	const options =
		listed || !sortConfig
			? MOBILE_SORTS
			: [
					...MOBILE_SORTS,
					{ label: describeSort(sortConfig), sort: sortConfig },
				];

	return (
		<Select
			value={sortId(sortConfig)}
			onValueChange={(value) =>
				onSortChange(
					options.find((option) => sortId(option.sort) === value)?.sort ?? null,
				)
			}
		>
			<SelectTrigger aria-label="Sort" className="h-11 text-lg md:hidden">
				<SelectValue>
					{(value: string) =>
						options.find((option) => sortId(option.sort) === value)?.label ??
						"Sort"
					}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={sortId(option.sort)} value={sortId(option.sort)}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

/** The card's third key figure: the sorted metric, or the dividend yield. */
function highlightFor(sortConfig: SortConfig | null): MetricField {
	const field = sortConfig?.field;
	return field && field in METRICS ? (field as MetricField) : "dividendYield";
}
