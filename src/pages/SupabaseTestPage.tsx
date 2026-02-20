import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
	AlertCircle,
	CheckCircle,
	Database,
	RefreshCw,
	XCircle,
} from "lucide-react";

import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Company } from "@/lib/supabase";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

function formatMarketCap(value: number | null): string {
	if (!value) return "N/A";
	if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
	if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
	if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
	return `$${value}`;
}

interface AuthStatusCardProps {
	email: string | null;
}

function AuthStatusCard({ email }: AuthStatusCardProps) {
	const isLoggedIn = Boolean(email);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Authentication Status</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoggedIn ? (
					<div>
						<CheckCircle />
						<div>
							<p>Logged in as:</p>
							<p>{email}</p>
						</div>
					</div>
				) : (
					<div>
						<AlertCircle />
						<div>
							<p>Not logged in</p>
							<p>
								<Link to="/login">Sign in</Link> to access protected features
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface DatabaseStatusCardProps {
	loading: boolean;
	error: string | null;
	companyCount: number;
}

function DatabaseStatusCard({
	loading,
	error,
	companyCount,
}: DatabaseStatusCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Database />
					Database Connection
				</CardTitle>
			</CardHeader>
			<CardContent>
				{loading && (
					<div>
						<RefreshCw />
						<span>Connecting to Supabase...</span>
					</div>
				)}

				{error && (
					<Alert variant="destructive">
						<XCircle />
						<AlertTitle>Connection Error</AlertTitle>
						<AlertDescription>
							{error}
							<br />
							Make sure you've created the "companies" table in Supabase and set
							up RLS policies.
						</AlertDescription>
					</Alert>
				)}

				{!loading && !error && (
					<div>
						<CheckCircle />
						<span>Connected! Found {companyCount} companies.</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface CompanyRowProps {
	company: Company;
}

function CompanyRow({ company }: CompanyRowProps) {
	const changePercent = company.change_percent || 0;
	const isPositive = changePercent >= 0;

	return (
		<TableRow>
			<TableCell>{company.name}</TableCell>
			<TableCell>
				<Badge variant="secondary">{company.symbol}</Badge>
			</TableCell>
			<TableCell>{company.sector || "N/A"}</TableCell>
			<TableCell>${company.price?.toFixed(2) || "N/A"}</TableCell>
			<TableCell>{formatMarketCap(company.market_cap)}</TableCell>
			<TableCell>
				<Badge variant={isPositive ? "default" : "destructive"}>
					{isPositive ? "+" : ""}
					{changePercent.toFixed(2)}%
				</Badge>
			</TableCell>
		</TableRow>
	);
}

interface CompaniesTableProps {
	companies: Company[];
}

function CompaniesTable({ companies }: CompaniesTableProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Companies from Supabase</CardTitle>
				<CardDescription>Live data fetched from your database</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Company</TableHead>
							<TableHead>Symbol</TableHead>
							<TableHead>Sector</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Market Cap</TableHead>
							<TableHead>Change</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{companies.map((company) => (
							<CompanyRow key={company.id} company={company} />
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

function EmptyState() {
	return (
		<Card>
			<CardContent>
				<Database />
				<p>No companies found in the database.</p>
				<p>Run the SQL commands from the setup guide to add sample data.</p>
			</CardContent>
		</Card>
	);
}

function SupabaseTestPage() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { user } = useAuthContext();

	const fetchCompanies = useCallback(async () => {
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
	}, []);

	useEffect(() => {
		fetchCompanies();
	}, [fetchCompanies]);

	return (
		<main>
			<section>
				<h1>Supabase Integration Test</h1>
				<p>This page fetches live data from your Supabase database.</p>
			</section>

			<Separator />

			<section>
				<AuthStatusCard email={user?.email ?? null} />
			</section>

			<section>
				<DatabaseStatusCard
					loading={loading}
					error={error}
					companyCount={companies.length}
				/>
			</section>

			{!loading && !error && companies.length > 0 && (
				<section>
					<CompaniesTable companies={companies} />
				</section>
			)}

			{!loading && !error && companies.length === 0 && (
				<section>
					<EmptyState />
				</section>
			)}

			<section>
				<Button variant="outline" onClick={fetchCompanies} disabled={loading}>
					<RefreshCw />
					{loading ? "Refreshing..." : "Refresh Data"}
				</Button>
			</section>
		</main>
	);
}

export default SupabaseTestPage;
