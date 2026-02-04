import { useState } from "react";

import { Building2, ExternalLink, Globe, Search, SearchX } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

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
			"Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.",
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

function formatNumber(num: number): string {
	if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
	if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
	if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
	if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
	return num.toLocaleString();
}

interface MetricCardProps {
	label: string;
	value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
	return (
		<Card>
			<CardContent>
				<p>{label}</p>
				<p>{value}</p>
			</CardContent>
		</Card>
	);
}

interface NewsItemProps {
	title: string;
	summary: string;
	time: string;
}

function NewsItem({ title, summary, time }: NewsItemProps) {
	return (
		<div>
			<h4>{title}</h4>
			<p>{summary}</p>
			<span>{time}</span>
		</div>
	);
}

function CompanyDetails({ company }: { company: CompanyResult }) {
	return (
		<Card>
			<CardHeader>
				<div>
					<Badge variant="secondary">{company.symbol}</Badge>
					<CardTitle>{company.name}</CardTitle>
				</div>
				<CardDescription>{company.description}</CardDescription>
				<div>
					<Badge variant="outline">{company.sector}</Badge>
					<Badge variant="outline">{company.industry}</Badge>
				</div>
				{company.website && (
					<Button
						variant="outline"
						render={
							<a
								href={company.website}
								target="_blank"
								rel="noopener noreferrer"
							/>
						}
					>
						<Globe />
						Visit Website
						<ExternalLink />
					</Button>
				)}
			</CardHeader>
			<CardContent>
				<h3>Key Information</h3>
				<div>
					<MetricCard
						label="Market Cap"
						value={`$${formatNumber(company.marketCap)}`}
					/>
					<MetricCard label="Sector" value={company.sector} />
					<MetricCard label="Industry" value={company.industry} />
					{company.employees && (
						<MetricCard
							label="Employees"
							value={formatNumber(company.employees)}
						/>
					)}
					{company.founded && (
						<MetricCard label="Founded" value={String(company.founded)} />
					)}
					<MetricCard label="Headquarters" value={company.headquarters} />
				</div>

				<Separator />

				<div>
					<Card>
						<CardHeader>
							<CardTitle>
								<Building2 />
								Financial Highlights
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div>
								<span>Market Cap</span>
								<span>${formatNumber(company.marketCap)}</span>
							</div>
							<div>
								<span>Revenue (TTM)</span>
								<span>$394.3B</span>
							</div>
							<div>
								<span>Net Income (TTM)</span>
								<span>$97.0B</span>
							</div>
							<div>
								<span>P/E Ratio</span>
								<span>25.8</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Recent News</CardTitle>
						</CardHeader>
						<CardContent>
							<NewsItem
								title="Strong Q4 Earnings Beat Expectations"
								summary="Company reports record quarterly revenue..."
								time="2 hours ago"
							/>
							<Separator />
							<NewsItem
								title="New Product Launch Announcement"
								summary="CEO unveils next-generation technology..."
								time="1 day ago"
							/>
							<Separator />
							<NewsItem
								title="Analyst Upgrade to Buy Rating"
								summary="Major investment bank raises price target..."
								time="3 days ago"
							/>
						</CardContent>
					</Card>
				</div>
			</CardContent>
		</Card>
	);
}

function EmptyState({
	onQuickSearch,
}: {
	onQuickSearch: (term: string) => void;
}) {
	return (
		<Card>
			<CardContent>
				<Search />
				<h3>Search for Companies</h3>
				<p>
					Enter a company name or stock symbol to get detailed company
					information, financial data, and recent news.
				</p>
				<div>
					<Button variant="outline" onClick={() => onQuickSearch("AAPL")}>
						Apple
					</Button>
					<Button variant="outline" onClick={() => onQuickSearch("TSLA")}>
						Tesla
					</Button>
					<Button variant="outline" onClick={() => onQuickSearch("NVDA")}>
						NVIDIA
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function NoResultsState({ searchTerm }: { searchTerm: string }) {
	return (
		<Card>
			<CardContent>
				<SearchX />
				<h3>No results found</h3>
				<p>
					No company found matching "{searchTerm}". Try searching for a
					different company name or symbol.
				</p>
			</CardContent>
		</Card>
	);
}

function CompanySearch() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(
		null,
	);
	const [isSearching, setIsSearching] = useState(false);

	const handleSearch = async () => {
		if (!searchTerm.trim()) return;

		setIsSearching(true);
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

	const handleQuickSearch = (term: string) => {
		setSearchTerm(term);
	};

	return (
		<main>
			<section>
				<h1>Company Search</h1>
				<p>Get comprehensive company information and analysis</p>
			</section>

			<Separator />

			<section>
				<Card>
					<CardContent>
						<div>
							<Input
								type="text"
								placeholder="Search by company name or symbol (e.g., Apple, AAPL)"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyPress={handleKeyPress}
							/>
							<Button
								onClick={handleSearch}
								disabled={isSearching || !searchTerm.trim()}
							>
								<Search />
								{isSearching ? "Searching..." : "Search"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</section>

			{selectedCompany && (
				<section>
					<CompanyDetails company={selectedCompany} />
				</section>
			)}

			{!selectedCompany && searchTerm && !isSearching && (
				<section>
					<NoResultsState searchTerm={searchTerm} />
				</section>
			)}

			{!searchTerm && (
				<section>
					<EmptyState onQuickSearch={handleQuickSearch} />
				</section>
			)}
		</main>
	);
}

export default CompanySearch;
