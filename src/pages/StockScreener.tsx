import { useMemo, useState } from "react";

import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface Stock {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
	volume: number;
	marketCap: number;
	peRatio?: number;
	dividend?: number;
	sector: string;
}

const mockStocks: Stock[] = [
	{
		symbol: "AAPL",
		name: "Apple Inc.",
		price: 185.92,
		change: 2.45,
		changePercent: 1.34,
		volume: 45234567,
		marketCap: 2900000000000,
		peRatio: 25.8,
		dividend: 0.96,
		sector: "Technology",
	},
	{
		symbol: "MSFT",
		name: "Microsoft Corporation",
		price: 378.85,
		change: -1.25,
		changePercent: -0.33,
		volume: 28456789,
		marketCap: 2800000000000,
		peRatio: 28.4,
		dividend: 3.0,
		sector: "Technology",
	},
	{
		symbol: "GOOGL",
		name: "Alphabet Inc.",
		price: 138.21,
		change: 0.89,
		changePercent: 0.65,
		volume: 31245678,
		marketCap: 1700000000000,
		peRatio: 22.1,
		sector: "Technology",
	},
	{
		symbol: "TSLA",
		name: "Tesla, Inc.",
		price: 242.84,
		change: 8.45,
		changePercent: 3.61,
		volume: 78456123,
		marketCap: 780000000000,
		peRatio: 65.2,
		sector: "Automotive",
	},
	{
		symbol: "NVDA",
		name: "NVIDIA Corporation",
		price: 468.95,
		change: 12.34,
		changePercent: 2.7,
		volume: 45123789,
		marketCap: 1150000000000,
		peRatio: 58.7,
		sector: "Technology",
	},
	{
		symbol: "JPM",
		name: "JPMorgan Chase & Co.",
		price: 155.32,
		change: -0.78,
		changePercent: -0.5,
		volume: 12345678,
		marketCap: 450000000000,
		peRatio: 12.5,
		dividend: 4.0,
		sector: "Financial Services",
	},
];

function formatNumber(num: number): string {
	if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
	if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
	if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
	if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
	return num.toLocaleString();
}

interface SortableHeaderProps {
	label: string;
	sortKey: keyof Stock;
	currentSortKey: keyof Stock | null;
	direction: "asc" | "desc" | null;
	onSort: (key: keyof Stock) => void;
}

function SortableHeader({
	label,
	sortKey,
	currentSortKey,
	direction,
	onSort,
}: SortableHeaderProps) {
	const isActive = currentSortKey === sortKey;

	return (
		<TableHead>
			<Button variant="ghost" onClick={() => onSort(sortKey)}>
				{label}
				{isActive && direction === "asc" && <ArrowUp />}
				{isActive && direction === "desc" && <ArrowDown />}
				{!isActive && <ArrowUpDown />}
			</Button>
		</TableHead>
	);
}

interface StockRowProps {
	stock: Stock;
}

function StockRow({ stock }: StockRowProps) {
	const isPositive = stock.change >= 0;

	return (
		<TableRow>
			<TableCell>
				<Badge variant="secondary">{stock.symbol}</Badge>
			</TableCell>
			<TableCell>{stock.name}</TableCell>
			<TableCell>${stock.price.toFixed(2)}</TableCell>
			<TableCell>
				<div>
					<span>
						{isPositive ? "+" : ""}${stock.change.toFixed(2)}
					</span>
					<span>
						({isPositive ? "+" : ""}
						{stock.changePercent.toFixed(2)}%)
					</span>
				</div>
			</TableCell>
			<TableCell>{formatNumber(stock.volume)}</TableCell>
			<TableCell>${formatNumber(stock.marketCap)}</TableCell>
			<TableCell>{stock.peRatio ? stock.peRatio.toFixed(1) : "-"}</TableCell>
			<TableCell>
				<Badge variant="outline">{stock.sector}</Badge>
			</TableCell>
		</TableRow>
	);
}

function StockScreener() {
	const [searchTerm, setSearchTerm] = useState("");
	const [sectorFilter, setSectorFilter] = useState("");
	const [priceMin, setPriceMin] = useState("");
	const [priceMax, setPriceMax] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Stock;
		direction: "asc" | "desc";
	} | null>(null);

	const sectors = [...new Set(mockStocks.map((stock) => stock.sector))];

	const filteredAndSortedStocks = useMemo(() => {
		const filtered = mockStocks.filter((stock) => {
			const matchesSearch =
				stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
				stock.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesSector = !sectorFilter || stock.sector === sectorFilter;
			const matchesPriceMin =
				!priceMin || stock.price >= Number.parseFloat(priceMin);
			const matchesPriceMax =
				!priceMax || stock.price <= Number.parseFloat(priceMax);

			return (
				matchesSearch && matchesSector && matchesPriceMin && matchesPriceMax
			);
		});

		if (sortConfig) {
			filtered.sort((a, b) => {
				const aValue = a[sortConfig.key];
				const bValue = b[sortConfig.key];

				if (aValue === undefined || bValue === undefined) return 0;

				if (aValue < bValue) {
					return sortConfig.direction === "asc" ? -1 : 1;
				}
				if (aValue > bValue) {
					return sortConfig.direction === "asc" ? 1 : -1;
				}
				return 0;
			});
		}

		return filtered;
	}, [searchTerm, sectorFilter, priceMin, priceMax, sortConfig]);

	const handleSort = (key: keyof Stock) => {
		let direction: "asc" | "desc" = "asc";
		if (
			sortConfig &&
			sortConfig.key === key &&
			sortConfig.direction === "asc"
		) {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSectorFilter("");
		setPriceMin("");
		setPriceMax("");
	};

	return (
		<main>
			<section>
				<h1>Stock Screener</h1>
				<p>
					Discover investment opportunities with our advanced stock screening
					tools
				</p>
			</section>

			<Separator />

			<section>
				<Card>
					<CardHeader>
						<CardTitle>
							<Filter />
							Filters
						</CardTitle>
						<CardDescription>
							Narrow down stocks by search, sector, and price range
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div>
							<div>
								<Label htmlFor="search">Search</Label>
								<div>
									<Search />
									<Input
										id="search"
										type="text"
										placeholder="Symbol or company name"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="sector">Sector</Label>
								<Select
									value={sectorFilter}
									onValueChange={(value) => setSectorFilter(value ?? "")}
								>
									<SelectTrigger id="sector">
										<SelectValue placeholder="All Sectors" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All Sectors</SelectItem>
										{sectors.map((sector) => (
											<SelectItem key={sector} value={sector}>
												{sector}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="min-price">Min Price ($)</Label>
								<Input
									id="min-price"
									type="number"
									placeholder="0"
									value={priceMin}
									onChange={(e) => setPriceMin(e.target.value)}
								/>
							</div>

							<div>
								<Label htmlFor="max-price">Max Price ($)</Label>
								<Input
									id="max-price"
									type="number"
									placeholder="1000"
									value={priceMax}
									onChange={(e) => setPriceMax(e.target.value)}
								/>
							</div>
						</div>

						<Button variant="outline" onClick={clearFilters}>
							Clear Filters
						</Button>
					</CardContent>
				</Card>
			</section>

			<section>
				<Card>
					<CardHeader>
						<CardTitle>
							Results
							<Badge variant="secondary">
								{filteredAndSortedStocks.length} stocks
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<SortableHeader
										label="Symbol"
										sortKey="symbol"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<SortableHeader
										label="Company"
										sortKey="name"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<SortableHeader
										label="Price"
										sortKey="price"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<SortableHeader
										label="Change"
										sortKey="change"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<SortableHeader
										label="Volume"
										sortKey="volume"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<SortableHeader
										label="Market Cap"
										sortKey="marketCap"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<SortableHeader
										label="P/E Ratio"
										sortKey="peRatio"
										currentSortKey={sortConfig?.key ?? null}
										direction={sortConfig?.direction ?? null}
										onSort={handleSort}
									/>
									<TableHead>Sector</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAndSortedStocks.map((stock) => (
									<StockRow key={stock.symbol} stock={stock} />
								))}
							</TableBody>
						</Table>

						{filteredAndSortedStocks.length === 0 && (
							<div>
								<p>No stocks match your current filters</p>
								<Button variant="outline" onClick={clearFilters}>
									Clear Filters
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</section>
		</main>
	);
}

export default StockScreener;
