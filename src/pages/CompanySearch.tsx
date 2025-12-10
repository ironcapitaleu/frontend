import React, { useState } from "react";

interface CompanyResult {
	symbol: string;
	name: string;
	description: string;
	sector: string;
	industry: string;
	marketCap: number;
	employees?: number;
	founded?: number;
	headquarters: string;
	website?: string;
}

// Mock data for demonstration
const mockCompanies: CompanyResult[] = [
	{
		symbol: "AAPL",
		name: "Apple Inc.",
		description:
			"Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
		sector: "Technology",
		industry: "Consumer Electronics",
		marketCap: 2900000000000,
		employees: 164000,
		founded: 1976,
		headquarters: "Cupertino, California",
		website: "https://www.apple.com",
	},
	{
		symbol: "TSLA",
		name: "Tesla, Inc.",
		description:
			"Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.",
		sector: "Automotive",
		industry: "Auto Manufacturers",
		marketCap: 780000000000,
		employees: 127855,
		founded: 2003,
		headquarters: "Austin, Texas",
		website: "https://www.tesla.com",
	},
	{
		symbol: "NVDA",
		name: "NVIDIA Corporation",
		description:
			"NVIDIA Corporation operates as a computing company in the United States, Taiwan, China, Hong Kong, and internationally.",
		sector: "Technology",
		industry: "Semiconductors",
		marketCap: 1150000000000,
		employees: 26196,
		founded: 1993,
		headquarters: "Santa Clara, California",
		website: "https://www.nvidia.com",
	},
];

const CompanySearch: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(
		null,
	);
	const [isSearching, setIsSearching] = useState(false);

	const handleSearch = async () => {
		if (!searchTerm.trim()) return;

		setIsSearching(true);
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		const results = mockCompanies.filter(
			(company) =>
				company.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
				company.name.toLowerCase().includes(searchTerm.toLowerCase()),
		);

		setSelectedCompany(results[0] || null);
		setIsSearching(false);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const formatNumber = (num: number) => {
		if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
		if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
		if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
		if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
		return num.toLocaleString();
	};

	return (
		<div className="container py-8">
			<div className="mb-8">
				<h1 className="h1 mb-4">Company Search</h1>
				<p className="text-secondary body-large">
					Get comprehensive company information and analysis
				</p>
			</div>

			{/* Search Bar */}
			<div className="glass p-6 rounded-xl mb-8">
				<div className="flex gap-4">
					<input
						type="text"
						placeholder="Search by company name or symbol (e.g., Apple, AAPL)"
						className="input flex-1"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyPress={handleKeyPress}
					/>
					<button
						onClick={handleSearch}
						disabled={isSearching || !searchTerm.trim()}
						className="btn btn-primary"
					>
						{isSearching ? (
							<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						) : (
							<>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								Search
							</>
						)}
					</button>
				</div>
			</div>

			{/* Company Details */}
			{selectedCompany && (
				<div className="glass rounded-xl overflow-hidden fade-in">
					{/* Header */}
					<div className="p-8 border-b border-glass-border">
						<div className="flex flex-col lg:flex-row lg:items-center gap-4">
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-full">
										{selectedCompany.symbol}
									</span>
									<h1 className="h2 text-primary">{selectedCompany.name}</h1>
								</div>
								<p className="text-secondary">{selectedCompany.description}</p>
							</div>
							{selectedCompany.website && (
								<a
									href={selectedCompany.website}
									target="_blank"
									rel="noopener noreferrer"
									className="btn btn-glass"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
									Visit Website
								</a>
							)}
						</div>
					</div>

					{/* Key Metrics */}
					<div className="p-8">
						<h2 className="h3 mb-6">Key Information</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							<div className="glass-strong p-6 rounded-xl">
								<h3 className="text-sm font-semibold text-tertiary mb-2">
									Market Cap
								</h3>
								<p className="h3 text-primary">
									${formatNumber(selectedCompany.marketCap)}
								</p>
							</div>

							<div className="glass-strong p-6 rounded-xl">
								<h3 className="text-sm font-semibold text-tertiary mb-2">
									Sector
								</h3>
								<p className="h3 text-primary">{selectedCompany.sector}</p>
							</div>

							<div className="glass-strong p-6 rounded-xl">
								<h3 className="text-sm font-semibold text-tertiary mb-2">
									Industry
								</h3>
								<p className="h3 text-primary">{selectedCompany.industry}</p>
							</div>

							{selectedCompany.employees && (
								<div className="glass-strong p-6 rounded-xl">
									<h3 className="text-sm font-semibold text-tertiary mb-2">
										Employees
									</h3>
									<p className="h3 text-primary">
										{selectedCompany.employees.toLocaleString()}
									</p>
								</div>
							)}

							{selectedCompany.founded && (
								<div className="glass-strong p-6 rounded-xl">
									<h3 className="text-sm font-semibold text-tertiary mb-2">
										Founded
									</h3>
									<p className="h3 text-primary">{selectedCompany.founded}</p>
								</div>
							)}

							<div className="glass-strong p-6 rounded-xl">
								<h3 className="text-sm font-semibold text-tertiary mb-2">
									Headquarters
								</h3>
								<p className="h3 text-primary">
									{selectedCompany.headquarters}
								</p>
							</div>
						</div>

						{/* Additional Sections */}
						<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Financial Highlights */}
							<div className="glass-strong p-6 rounded-xl">
								<h3 className="h3 mb-4">Financial Highlights</h3>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-secondary">Market Cap</span>
										<span className="font-semibold">
											${formatNumber(selectedCompany.marketCap)}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-secondary">Revenue (TTM)</span>
										<span className="font-semibold">$394.3B</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-secondary">Net Income (TTM)</span>
										<span className="font-semibold">$97.0B</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-secondary">P/E Ratio</span>
										<span className="font-semibold">25.8</span>
									</div>
								</div>
							</div>

							{/* Recent News */}
							<div className="glass-strong p-6 rounded-xl">
								<h3 className="h3 mb-4">Recent News</h3>
								<div className="space-y-4">
									<div className="pb-3 border-b border-glass-border">
										<h4 className="font-semibold text-primary mb-1">
											Strong Q4 Earnings Beat Expectations
										</h4>
										<p className="text-secondary text-sm">
											Company reports record quarterly revenue...
										</p>
										<span className="text-xs text-tertiary">2 hours ago</span>
									</div>
									<div className="pb-3 border-b border-glass-border">
										<h4 className="font-semibold text-primary mb-1">
											New Product Launch Announcement
										</h4>
										<p className="text-secondary text-sm">
											CEO unveils next-generation technology...
										</p>
										<span className="text-xs text-tertiary">1 day ago</span>
									</div>
									<div>
										<h4 className="font-semibold text-primary mb-1">
											Analyst Upgrade to Buy Rating
										</h4>
										<p className="text-secondary text-sm">
											Major investment bank raises price target...
										</p>
										<span className="text-xs text-tertiary">3 days ago</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* No Results */}
			{searchTerm && !selectedCompany && !isSearching && (
				<div className="glass p-12 rounded-xl text-center">
					<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass-bg flex items-center justify-center">
						<svg
							className="w-8 h-8 text-tertiary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m-3 16a9 9 0 119-9 9 9 0 01-9 9z"
							/>
						</svg>
					</div>
					<h3 className="h3 mb-2">No results found</h3>
					<p className="text-secondary">
						Try searching for a different company name or symbol
					</p>
				</div>
			)}

			{/* Getting Started */}
			{!searchTerm && (
				<div className="glass p-12 rounded-xl text-center">
					<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
						<svg
							className="w-8 h-8 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
					<h3 className="h3 mb-2">Search for Companies</h3>
					<p className="text-secondary mb-6">
						Enter a company name or stock symbol to get detailed company
						information, financial data, and recent news.
					</p>
					<div className="flex flex-wrap gap-2 justify-center">
						<button
							onClick={() => setSearchTerm("AAPL")}
							className="btn btn-glass text-sm"
						>
							Apple
						</button>
						<button
							onClick={() => setSearchTerm("TSLA")}
							className="btn btn-glass text-sm"
						>
							Tesla
						</button>
						<button
							onClick={() => setSearchTerm("NVDA")}
							className="btn btn-glass text-sm"
						>
							NVIDIA
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default CompanySearch;
