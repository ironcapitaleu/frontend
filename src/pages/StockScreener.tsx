import type React from "react";
import { useState, useMemo } from "react";

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

// Mock data for demonstration
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

const StockScreener: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [sectorFilter, setSectorFilter] = useState("");
	const [priceMin, setPriceMin] = useState("");
	const [priceMax, setPriceMax] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Stock;
		direction: "asc" | "desc";
	} | null>(null);

	const filteredAndSortedStocks = useMemo(() => {
		const filtered = mockStocks.filter((stock) => {
			const matchesSearch =
				stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
				stock.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesSector = !sectorFilter || stock.sector === sectorFilter;
			const matchesPriceMin = !priceMin || stock.price >= parseFloat(priceMin);
			const matchesPriceMax = !priceMax || stock.price <= parseFloat(priceMax);

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

	const formatNumber = (num: number) => {
		if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return num.toLocaleString();
	};

	const sectors = [...new Set(mockStocks.map((stock) => stock.sector))];

	return (
		<div className="container py-8">
			<div className="mb-8">
				<h1 className="h1 mb-4">Stock Screener</h1>
				<p className="text-secondary body-large">
					Discover investment opportunities with our advanced stock screening
					tools
				</p>
			</div>

			{/* Filters */}
			<div className="glass p-6 rounded-xl mb-8">
				<h2 className="h3 mb-4">Filters</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-semibold mb-2">Search</label>
						<input
							type="text"
							placeholder="Symbol or company name"
							className="input"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-semibold mb-2">Sector</label>
						<select
							className="input"
							value={sectorFilter}
							onChange={(e) => setSectorFilter(e.target.value)}
						>
							<option value="">All Sectors</option>
							{sectors.map((sector) => (
								<option key={sector} value={sector}>
									{sector}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-semibold mb-2">
							Min Price ($)
						</label>
						<input
							type="number"
							placeholder="0"
							className="input"
							value={priceMin}
							onChange={(e) => setPriceMin(e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-semibold mb-2">
							Max Price ($)
						</label>
						<input
							type="number"
							placeholder="1000"
							className="input"
							value={priceMax}
							onChange={(e) => setPriceMax(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className="glass rounded-xl overflow-hidden">
				<div className="p-6 border-b border-glass-border">
					<h2 className="h3">
						Results ({filteredAndSortedStocks.length} stocks)
					</h2>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-glass-border">
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("symbol")}
								>
									Symbol{" "}
									{sortConfig?.key === "symbol" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("name")}
								>
									Company{" "}
									{sortConfig?.key === "name" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("price")}
								>
									Price{" "}
									{sortConfig?.key === "price" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("change")}
								>
									Change{" "}
									{sortConfig?.key === "change" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("volume")}
								>
									Volume{" "}
									{sortConfig?.key === "volume" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("marketCap")}
								>
									Market Cap{" "}
									{sortConfig?.key === "marketCap" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="text-left p-4 cursor-pointer hover:bg-glass-bg transition-colors"
									onClick={() => handleSort("peRatio")}
								>
									P/E Ratio{" "}
									{sortConfig?.key === "peRatio" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th className="text-left p-4">Sector</th>
							</tr>
						</thead>
						<tbody>
							{filteredAndSortedStocks.map((stock) => (
								<tr
									key={stock.symbol}
									className="border-b border-glass-border hover:bg-glass-bg transition-colors"
								>
									<td className="p-4">
										<span className="font-bold text-primary">
											{stock.symbol}
										</span>
									</td>
									<td className="p-4">
										<span className="text-primary">{stock.name}</span>
									</td>
									<td className="p-4">
										<span className="font-semibold">
											${stock.price.toFixed(2)}
										</span>
									</td>
									<td className="p-4">
										<div className="flex flex-col">
											<span
												className={`font-semibold ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}
											>
												{stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}
											</span>
											<span
												className={`text-sm ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}
											>
												({stock.changePercent >= 0 ? "+" : ""}
												{stock.changePercent.toFixed(2)}%)
											</span>
										</div>
									</td>
									<td className="p-4">
										<span className="text-secondary">
											{formatNumber(stock.volume)}
										</span>
									</td>
									<td className="p-4">
										<span className="text-secondary">
											${formatNumber(stock.marketCap)}
										</span>
									</td>
									<td className="p-4">
										<span className="text-secondary">
											{stock.peRatio ? stock.peRatio.toFixed(1) : "-"}
										</span>
									</td>
									<td className="p-4">
										<span className="text-xs px-2 py-1 rounded-full bg-glass-bg border border-glass-border">
											{stock.sector}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default StockScreener;
