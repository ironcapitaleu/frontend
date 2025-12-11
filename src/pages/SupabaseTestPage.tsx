import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Company } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function SupabaseTestPage() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { user } = useAuthContext();

	useEffect(() => {
		fetchCompanies();
	}, []);

	async function fetchCompanies() {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("companies")
				.select("*")
				.order("market_cap", { ascending: false });

			if (error) throw error;
			setCompanies(data || []);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch companies",
			);
		} finally {
			setLoading(false);
		}
	}

	const formatMarketCap = (value: number | null) => {
		if (!value) return "N/A";
		if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
		if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
		if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
		return `$${value}`;
	};

	return (
		<div className="container py-16">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="h1 mb-2">Supabase Integration Test</h1>
					<p className="text-secondary body-large">
						This page fetches live data from your Supabase database.
					</p>
				</div>

				{/* Auth Status Card */}
				<div className="glass p-6 mb-8">
					<h2 className="h3 mb-4">Authentication Status</h2>
					{user ? (
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
								<span className="text-green-400 text-xl">✓</span>
							</div>
							<div>
								<p className="font-semibold">Logged in as:</p>
								<p className="text-secondary">{user.email}</p>
							</div>
						</div>
					) : (
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
								<span className="text-yellow-400 text-xl">!</span>
							</div>
							<div>
								<p className="font-semibold">Not logged in</p>
								<p className="text-secondary">
									<Link to="/login" className="text-primary hover:underline">
										Sign in
									</Link>{" "}
									to access protected features
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Database Status Card */}
				<div className="glass p-6 mb-8">
					<h2 className="h3 mb-4">Database Connection</h2>
					{loading ? (
						<div className="flex items-center gap-3">
							<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
							<span className="text-secondary">Connecting to Supabase...</span>
						</div>
					) : error ? (
						<div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
							<p className="font-semibold">Connection Error</p>
							<p className="text-sm mt-1">{error}</p>
							<p className="text-sm mt-2 text-red-300">
								Make sure you've created the "companies" table in Supabase and
								set up RLS policies.
							</p>
						</div>
					) : (
						<div className="flex items-center gap-3">
							<div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
								<span className="text-white text-sm">✓</span>
							</div>
							<span className="text-green-400">
								Connected! Found {companies.length} companies.
							</span>
						</div>
					)}
				</div>

				{/* Companies Table */}
				{!loading && !error && companies.length > 0 && (
					<div className="glass overflow-hidden">
						<div className="p-6 border-b border-glass-border">
							<h2 className="h3">Companies from Supabase</h2>
							<p className="text-secondary text-sm mt-1">
								Live data fetched from your database
							</p>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-glass-border">
										<th className="px-6 py-4 text-left text-sm font-semibold">
											Company
										</th>
										<th className="px-6 py-4 text-left text-sm font-semibold">
											Symbol
										</th>
										<th className="px-6 py-4 text-left text-sm font-semibold">
											Sector
										</th>
										<th className="px-6 py-4 text-right text-sm font-semibold">
											Price
										</th>
										<th className="px-6 py-4 text-right text-sm font-semibold">
											Market Cap
										</th>
										<th className="px-6 py-4 text-right text-sm font-semibold">
											Change
										</th>
									</tr>
								</thead>
								<tbody>
									{companies.map((company) => (
										<tr
											key={company.id}
											className="border-b border-glass-border hover:bg-glass-bg transition-colors"
										>
											<td className="px-6 py-4 font-medium">{company.name}</td>
											<td className="px-6 py-4 text-primary font-mono">
												{company.symbol}
											</td>
											<td className="px-6 py-4 text-secondary">
												{company.sector || "N/A"}
											</td>
											<td className="px-6 py-4 text-right font-mono">
												${company.price?.toFixed(2) || "N/A"}
											</td>
											<td className="px-6 py-4 text-right text-secondary">
												{formatMarketCap(company.market_cap)}
											</td>
											<td
												className={`px-6 py-4 text-right font-mono ${
													(company.change_percent || 0) >= 0
														? "text-green-400"
														: "text-red-400"
												}`}
											>
												{(company.change_percent || 0) >= 0 ? "+" : ""}
												{company.change_percent?.toFixed(2) || "0.00"}%
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!loading && !error && companies.length === 0 && (
					<div className="glass p-12 text-center">
						<p className="text-secondary mb-4">
							No companies found in the database.
						</p>
						<p className="text-sm text-tertiary">
							Run the SQL commands from the setup guide to add sample data.
						</p>
					</div>
				)}

				{/* Refresh Button */}
				<div className="mt-8 text-center">
					<button
						onClick={fetchCompanies}
						disabled={loading}
						className="btn btn-glass"
					>
						{loading ? "Refreshing..." : "Refresh Data"}
					</button>
				</div>
			</div>
		</div>
	);
}
