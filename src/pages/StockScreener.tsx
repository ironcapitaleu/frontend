import { useMemo, useState } from "react";

import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stock {
	readonly symbol: string;
	readonly name: string;
	readonly sector: string;
	readonly country: string;
	readonly price: number;
	readonly marketCap: number;
	readonly changePercent1M: number;
	readonly peRatio: number | null;
	readonly priceToCash: number | null;
	readonly priceToFcf: number | null;
	readonly quickRatio: number | null;
	readonly currentRatio: number | null;
	readonly buybackYield: number | null;
	readonly dividendYield: number | null;
	readonly weekLow52: number;
	readonly weekHigh52: number;
}

interface FilterState {
	search: string;
	country: string;
	sector: string;
	peMin: string;
	peMax: string;
	priceToCashMax: string;
	priceToFcfMax: string;
	quickRatioMin: string;
	currentRatioMin: string;
	buybackYieldMin: string;
	dividendYieldMin: string;
	nearFiftyTwoWeekLow: boolean;
	downLastMonth: string;
}

interface SortConfig {
	field: keyof Stock;
	direction: "asc" | "desc";
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: FilterState = {
	search: "",
	country: "",
	sector: "",
	peMin: "",
	peMax: "",
	priceToCashMax: "",
	priceToFcfMax: "",
	quickRatioMin: "",
	currentRatioMin: "",
	buybackYieldMin: "",
	dividendYieldMin: "",
	nearFiftyTwoWeekLow: false,
	downLastMonth: "",
};

const MOCK_STOCKS: readonly Stock[] = [
	{
		symbol: "AAPL",
		name: "Apple Inc.",
		sector: "Technology",
		country: "US",
		price: 172.5,
		marketCap: 2_650_000_000_000,
		changePercent1M: -3.2,
		peRatio: 28.4,
		priceToCash: 19.2,
		priceToFcf: 26.1,
		quickRatio: 0.91,
		currentRatio: 1.07,
		buybackYield: 3.8,
		dividendYield: 0.5,
		weekLow52: 163.08,
		weekHigh52: 199.62,
	},
	{
		symbol: "MSFT",
		name: "Microsoft Corp.",
		sector: "Technology",
		country: "US",
		price: 415.8,
		marketCap: 3_090_000_000_000,
		changePercent1M: 1.8,
		peRatio: 35.2,
		priceToCash: 28.6,
		priceToFcf: 41.7,
		quickRatio: 1.54,
		currentRatio: 1.83,
		buybackYield: 1.2,
		dividendYield: 0.7,
		weekLow52: 362.9,
		weekHigh52: 468.35,
	},
	{
		symbol: "JPM",
		name: "JPMorgan Chase",
		sector: "Finance",
		country: "US",
		price: 197.4,
		marketCap: 567_000_000_000,
		changePercent1M: -1.4,
		peRatio: 11.2,
		priceToCash: null,
		priceToFcf: null,
		quickRatio: null,
		currentRatio: null,
		buybackYield: 2.1,
		dividendYield: 2.3,
		weekLow52: 172.11,
		weekHigh52: 223.72,
	},
	{
		symbol: "XOM",
		name: "Exxon Mobil Corp.",
		sector: "Energy",
		country: "US",
		price: 109.2,
		marketCap: 470_000_000_000,
		changePercent1M: -4.7,
		peRatio: 14.1,
		priceToCash: 8.4,
		priceToFcf: 12.3,
		quickRatio: 0.79,
		currentRatio: 1.48,
		buybackYield: 4.5,
		dividendYield: 3.7,
		weekLow52: 99.58,
		weekHigh52: 126.34,
	},
	{
		symbol: "JNJ",
		name: "Johnson & Johnson",
		sector: "Healthcare",
		country: "US",
		price: 158.3,
		marketCap: 382_000_000_000,
		changePercent1M: -0.6,
		peRatio: 16.2,
		priceToCash: 12.1,
		priceToFcf: 18.6,
		quickRatio: 0.98,
		currentRatio: 1.37,
		buybackYield: 2.0,
		dividendYield: 3.1,
		weekLow52: 143.12,
		weekHigh52: 175.87,
	},
	{
		symbol: "SAP",
		name: "SAP SE",
		sector: "Technology",
		country: "DE",
		price: 198.6,
		marketCap: 237_000_000_000,
		changePercent1M: 2.3,
		peRatio: 33.8,
		priceToCash: 24.1,
		priceToFcf: 39.4,
		quickRatio: 1.19,
		currentRatio: 1.42,
		buybackYield: 0.8,
		dividendYield: 1.3,
		weekLow52: 151.2,
		weekHigh52: 212.45,
	},
	{
		symbol: "BAYN",
		name: "Bayer AG",
		sector: "Healthcare",
		country: "DE",
		price: 9.5,
		marketCap: 9_300_000_000,
		changePercent1M: -8.5,
		peRatio: 7.8,
		priceToCash: 5.9,
		priceToFcf: 10.2,
		quickRatio: 1.11,
		currentRatio: 1.87,
		buybackYield: 0.0,
		dividendYield: 7.2,
		weekLow52: 7.84,
		weekHigh52: 17.32,
	},
	{
		symbol: "TM",
		name: "Toyota Motor Corp.",
		sector: "Consumer",
		country: "JP",
		price: 185.4,
		marketCap: 252_000_000_000,
		changePercent1M: -2.8,
		peRatio: 9.1,
		priceToCash: 7.4,
		priceToFcf: 11.8,
		quickRatio: 1.02,
		currentRatio: 1.24,
		buybackYield: 1.5,
		dividendYield: 2.8,
		weekLow52: 165.4,
		weekHigh52: 226.17,
	},
	{
		symbol: "HMC",
		name: "Honda Motor Co.",
		sector: "Consumer",
		country: "JP",
		price: 28.4,
		marketCap: 48_700_000_000,
		changePercent1M: -4.1,
		peRatio: 7.2,
		priceToCash: 5.1,
		priceToFcf: 8.9,
		quickRatio: 0.91,
		currentRatio: 1.13,
		buybackYield: 0.5,
		dividendYield: 3.3,
		weekLow52: 25.8,
		weekHigh52: 37.56,
	},
	{
		symbol: "HSBC",
		name: "HSBC Holdings",
		sector: "Finance",
		country: "GB",
		price: 41.7,
		marketCap: 163_000_000_000,
		changePercent1M: 0.4,
		peRatio: 7.9,
		priceToCash: null,
		priceToFcf: null,
		quickRatio: null,
		currentRatio: null,
		buybackYield: 3.0,
		dividendYield: 6.2,
		weekLow52: 35.4,
		weekHigh52: 46.8,
	},
	{
		symbol: "BP",
		name: "BP plc",
		sector: "Energy",
		country: "GB",
		price: 27.8,
		marketCap: 83_200_000_000,
		changePercent1M: -5.2,
		peRatio: 7.1,
		priceToCash: 5.0,
		priceToFcf: 9.8,
		quickRatio: 0.71,
		currentRatio: 1.19,
		buybackYield: 5.0,
		dividendYield: 5.8,
		weekLow52: 25.44,
		weekHigh52: 38.22,
	},
	{
		symbol: "NSRGY",
		name: "Nestlé S.A.",
		sector: "Consumer",
		country: "CH",
		price: 83.2,
		marketCap: 238_000_000_000,
		changePercent1M: -1.9,
		peRatio: 19.4,
		priceToCash: 15.3,
		priceToFcf: 22.7,
		quickRatio: 0.61,
		currentRatio: 0.86,
		buybackYield: 2.5,
		dividendYield: 2.9,
		weekLow52: 75.48,
		weekHigh52: 100.12,
	},
];

const COUNTRIES = ["CH", "DE", "GB", "JP", "US"] as const;

const SECTORS = [
	"Consumer",
	"Energy",
	"Finance",
	"Healthcare",
	"Industrials",
	"Technology",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMarketCap(value: number): string {
	if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
	if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
	if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
	return `$${value.toLocaleString()}`;
}

function fmt(value: number | null, decimals = 1): string {
	if (value === null) return "—";
	return value.toFixed(decimals);
}

function fmtPct(value: number | null): string {
	if (value === null) return "—";
	return `${value.toFixed(1)}%`;
}

function isNearFiftyTwoWeekLow(stock: Stock): boolean {
	return stock.price <= stock.weekLow52 * 1.2;
}

function countActiveFilters(filters: FilterState): number {
	return [
		filters.search,
		filters.country,
		filters.sector,
		filters.peMin,
		filters.peMax,
		filters.priceToCashMax,
		filters.priceToFcfMax,
		filters.quickRatioMin,
		filters.currentRatioMin,
		filters.buybackYieldMin,
		filters.dividendYieldMin,
		filters.nearFiftyTwoWeekLow,
		filters.downLastMonth,
	].filter(Boolean).length;
}

// ── Presentational Components ──────────────────────────────────────────────────

interface SortableHeaderProps {
	field: keyof Stock;
	label: string;
	sortConfig: SortConfig | null;
	onSort: (field: keyof Stock) => void;
	className?: string;
}

function SortableHeader({
	field,
	label,
	sortConfig,
	onSort,
	className,
}: SortableHeaderProps) {
	const isActive = sortConfig?.field === field;
	const direction = sortConfig?.direction;

	return (
		<TableHead
			className={cn("cursor-pointer select-none", isActive && "bg-primary/4", className)}
			onClick={() => onSort(field)}
		>
			<span
				className={cn(
					"inline-flex items-center gap-1 transition-colors",
					isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground",
				)}
			>
				{label}
				{isActive && direction === "asc" ? (
					<ArrowUp size={11} />
				) : isActive && direction === "desc" ? (
					<ArrowDown size={11} />
				) : (
					<ArrowUpDown size={11} className="opacity-40" />
				)}
			</span>
		</TableHead>
	);
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StockScreener() {
	const navigate = useNavigate();
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
	const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

	const setFilter = (field: keyof FilterState, value: string | boolean) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
	};

	const resetFilters = () => {
		setFilters(EMPTY_FILTERS);
	};

	const handleSort = (field: keyof Stock) => {
		setSortConfig((prev) => {
			if (!prev || prev.field !== field) return { field, direction: "asc" };
			if (prev.direction === "asc") return { field, direction: "desc" };
			return null;
		});
	};

	const results = useMemo(() => {
		let list = [...MOCK_STOCKS];

		if (filters.search) {
			const q = filters.search.toLowerCase();
			list = list.filter(
				(s) =>
					s.symbol.toLowerCase().includes(q) ||
					s.name.toLowerCase().includes(q),
			);
		}
		if (filters.country) {
			list = list.filter((s) => s.country === filters.country);
		}
		if (filters.sector) {
			list = list.filter((s) => s.sector === filters.sector);
		}
		if (filters.peMin) {
			const min = parseFloat(filters.peMin);
			list = list.filter((s) => s.peRatio !== null && s.peRatio >= min);
		}
		if (filters.peMax) {
			const max = parseFloat(filters.peMax);
			list = list.filter((s) => s.peRatio !== null && s.peRatio <= max);
		}
		if (filters.priceToCashMax) {
			const max = parseFloat(filters.priceToCashMax);
			list = list.filter((s) => s.priceToCash !== null && s.priceToCash <= max);
		}
		if (filters.priceToFcfMax) {
			const max = parseFloat(filters.priceToFcfMax);
			list = list.filter((s) => s.priceToFcf !== null && s.priceToFcf <= max);
		}
		if (filters.quickRatioMin) {
			const min = parseFloat(filters.quickRatioMin);
			list = list.filter((s) => s.quickRatio !== null && s.quickRatio >= min);
		}
		if (filters.currentRatioMin) {
			const min = parseFloat(filters.currentRatioMin);
			list = list.filter(
				(s) => s.currentRatio !== null && s.currentRatio >= min,
			);
		}
		if (filters.buybackYieldMin) {
			const min = parseFloat(filters.buybackYieldMin);
			list = list.filter(
				(s) => s.buybackYield !== null && s.buybackYield >= min,
			);
		}
		if (filters.dividendYieldMin) {
			const min = parseFloat(filters.dividendYieldMin);
			list = list.filter(
				(s) => s.dividendYield !== null && s.dividendYield >= min,
			);
		}
		if (filters.nearFiftyTwoWeekLow) {
			list = list.filter(isNearFiftyTwoWeekLow);
		}
		if (filters.downLastMonth) {
			const threshold = parseFloat(filters.downLastMonth);
			if (!Number.isNaN(threshold)) {
				list = list.filter((s) => s.changePercent1M <= -threshold);
			}
		}

		if (sortConfig) {
			list.sort((a, b) => {
				const av = a[sortConfig.field];
				const bv = b[sortConfig.field];
				if (av === null) return 1;
				if (bv === null) return -1;
				if (typeof av === "string" && typeof bv === "string") {
					return sortConfig.direction === "asc"
						? av.localeCompare(bv)
						: bv.localeCompare(av);
				}
				return sortConfig.direction === "asc"
					? (av as number) - (bv as number)
					: (bv as number) - (av as number);
			});
		}

		return list;
	}, [filters, sortConfig]);

	const activeCount = countActiveFilters(filters);
	const colClass = (field: keyof Stock) =>
		sortConfig?.field === field ? "bg-primary/4" : undefined;

	return (
		<div className="flex-1 bg-background flex flex-col gap-5 px-8 py-6">
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-4">
				<span className="text-sm text-muted-foreground">
					{results.length} {results.length === 1 ? "result" : "results"}
				</span>
				<div className="flex items-center gap-3">
					{activeCount > 0 && (
						<button
							type="button"
							onClick={resetFilters}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						>
							Reset
						</button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setFiltersOpen((v) => !v)}
						aria-expanded={filtersOpen}
						className="gap-2 cursor-pointer"
					>
						<Filter size={14} />
						Filters
						{activeCount > 0 && (
							<Badge className="ml-0.5 h-4 min-w-4 px-1 text-10 font-medium rounded-full">
								{activeCount}
							</Badge>
						)}
					</Button>
				</div>
			</div>

			{/* Collapsible filter panel */}
			<div className={`filter-panel${filtersOpen ? " open" : ""}`}>
				<div>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6 pb-6 border-b border-border/50">
						{/* Search */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Search
							</Label>
							<Input
								type="text"
								placeholder="Symbol or name"
								value={filters.search}
								onChange={(e) => setFilter("search", e.target.value)}
							/>
						</div>

						{/* Geography */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Country
							</Label>
							<Select
								value={filters.country || "ALL"}
								onValueChange={(v) =>
									setFilter("country", v === "ALL" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All countries" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All countries</SelectItem>
									{COUNTRIES.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Sector */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Sector
							</Label>
							<Select
								value={filters.sector || "ALL"}
								onValueChange={(v) =>
									setFilter("sector", v === "ALL" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All sectors" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All sectors</SelectItem>
									{SECTORS.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Valuation */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Valuation
							</Label>
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<Input
										type="number"
										placeholder="P/E min"
										value={filters.peMin}
										onChange={(e) => setFilter("peMin", e.target.value)}
									/>
									<span className="text-muted-foreground text-xs shrink-0">
										–
									</span>
									<Input
										type="number"
										placeholder="max"
										value={filters.peMax}
										onChange={(e) => setFilter("peMax", e.target.value)}
									/>
								</div>
								<Input
									type="number"
									placeholder="P/Cash max"
									value={filters.priceToCashMax}
									onChange={(e) => setFilter("priceToCashMax", e.target.value)}
								/>
								<Input
									type="number"
									placeholder="P/FCF max"
									value={filters.priceToFcfMax}
									onChange={(e) => setFilter("priceToFcfMax", e.target.value)}
								/>
							</div>
						</div>

						{/* Quality */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Quality
							</Label>
							<div className="flex flex-col gap-2">
								<Input
									type="number"
									placeholder="Quick Ratio min"
									value={filters.quickRatioMin}
									onChange={(e) => setFilter("quickRatioMin", e.target.value)}
								/>
								<Input
									type="number"
									placeholder="Current Ratio min"
									value={filters.currentRatioMin}
									onChange={(e) => setFilter("currentRatioMin", e.target.value)}
								/>
							</div>
						</div>

						{/* Yield */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Yield
							</Label>
							<div className="flex flex-col gap-2">
								<Input
									type="number"
									placeholder="Buyback Yield min %"
									value={filters.buybackYieldMin}
									onChange={(e) => setFilter("buybackYieldMin", e.target.value)}
								/>
								<Input
									type="number"
									placeholder="Dividend Yield min %"
									value={filters.dividendYieldMin}
									onChange={(e) =>
										setFilter("dividendYieldMin", e.target.value)
									}
								/>
							</div>
						</div>

						{/* Technical */}
						<div className="flex flex-col gap-2">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								Technical
							</Label>
							<div className="flex flex-col gap-3">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={filters.nearFiftyTwoWeekLow}
										onChange={(e) =>
											setFilter("nearFiftyTwoWeekLow", e.target.checked)
										}
										className="rounded border-border accent-primary"
									/>
									<span className="text-sm text-foreground">
										Near 52-wk Low
									</span>
								</label>
								<Input
									type="number"
									placeholder="Down last month ≥ %"
									value={filters.downLastMonth}
									onChange={(e) => setFilter("downLastMonth", e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Results table */}
			<div className="screener-table rounded-lg border border-border overflow-hidden bg-card">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted [&_th]:py-3">
						<TableRow className="border-b-2 hover:bg-transparent">
						<SortableHeader
							field="symbol"
							label="Symbol"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="name"
							label="Company"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="country"
							label="Country"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="marketCap"
							label="Mkt Cap"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="price"
							label="Price"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="changePercent1M"
							label="1M %"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="peRatio"
							label="P/E"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="priceToFcf"
							label="P/FCF"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="priceToCash"
							label="P/Cash"
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="quickRatio"
							label="Quick R."
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="currentRatio"
							label="Curr. R."
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="buybackYield"
							label="Buyback Y."
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
						<SortableHeader
							field="dividendYield"
							label="Div. Y."
							sortConfig={sortConfig}
							onSort={handleSort}
						/>
					</TableRow>
					</TableHeader>
					<TableBody className="[&_td]:py-2.5 [&_td]:px-3">
						{results.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={13}
								className="py-16 text-center text-muted-foreground"
							>
								No results match the current filters.
							</TableCell>
						</TableRow>
					) : (
						results.map((stock) => (
							<TableRow
								key={stock.symbol}
								onClick={() => navigate(`/companies/${stock.symbol}`)}
								className="cursor-pointer even:bg-foreground/2 hover:bg-foreground/4"
							>
								<TableCell className={cn("font-medium", colClass("symbol"))}>
									<span className="flex items-center gap-2">
										{stock.symbol}
										{isNearFiftyTwoWeekLow(stock) && (
											<Badge
												variant="outline"
												className="text-amber-500 border-amber-500/30 bg-amber-500/5 text-10 font-normal py-0 px-1.5"
											>
												Near Low
											</Badge>
										)}
									</span>
								</TableCell>
								<TableCell className={cn("text-muted-foreground", colClass("name"))}>
									{stock.name}
								</TableCell>
								<TableCell className={cn("text-muted-foreground", colClass("country"))}>
									{stock.country}
								</TableCell>
								<TableCell className={colClass("marketCap")}>{formatMarketCap(stock.marketCap)}</TableCell>
								<TableCell className={colClass("price")}>${stock.price.toFixed(2)}</TableCell>
								<TableCell
									className={cn(
										stock.changePercent1M >= 0
											? "text-emerald-500"
											: "text-red-500",
										colClass("changePercent1M"),
									)}
								>
									{stock.changePercent1M >= 0 ? "+" : ""}
									{stock.changePercent1M.toFixed(1)}%
								</TableCell>
								<TableCell className={colClass("peRatio")}>{fmt(stock.peRatio)}</TableCell>
								<TableCell className={colClass("priceToFcf")}>{fmt(stock.priceToFcf)}</TableCell>
								<TableCell className={colClass("priceToCash")}>{fmt(stock.priceToCash)}</TableCell>
								<TableCell className={colClass("quickRatio")}>{fmt(stock.quickRatio, 2)}</TableCell>
								<TableCell className={colClass("currentRatio")}>{fmt(stock.currentRatio, 2)}</TableCell>
								<TableCell className={colClass("buybackYield")}>{fmtPct(stock.buybackYield)}</TableCell>
								<TableCell className={colClass("dividendYield")}>{fmtPct(stock.dividendYield)}</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
			</div>
		</div>
	);
}
