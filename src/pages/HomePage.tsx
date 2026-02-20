import { Link } from "react-router-dom";

import { BarChart3, LineChart, Search, TrendingUp } from "lucide-react";

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

interface FeatureCardProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	to?: string;
}

function FeatureCard({ title, description, icon, to }: FeatureCardProps) {
	const content = (
		<Card>
			<CardHeader>
				<div>{icon}</div>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
		</Card>
	);

	if (to) {
		return <Link to={to}>{content}</Link>;
	}

	return content;
}

interface StatCardProps {
	value: string;
	label: string;
}

function StatCard({ value, label }: StatCardProps) {
	return (
		<div>
			<div>{value}</div>
			<div>{label}</div>
		</div>
	);
}

function HeroSection() {
	return (
		<section>
			<Badge variant="secondary">Premium Investment Partnership</Badge>
			<h1>Iron Capital</h1>
			<p>
				Iron Capital combines advanced analytics with strategic investment
				insights to deliver exceptional returns for our partners. Access
				professional-grade tools and research that power informed investment
				decisions.
			</p>
			<div>
				<Button render={<Link to="/screener" />}>Explore Stock Screener</Button>
				<Button variant="outline" render={<Link to="/about" />}>
					Learn More
				</Button>
			</div>
		</section>
	);
}

function FeaturesSection() {
	const features: FeatureCardProps[] = [
		{
			title: "Stock Screener",
			description:
				"Advanced filtering and analysis tools to identify investment opportunities based on fundamentals, technicals, and market data.",
			icon: <BarChart3 />,
			to: "/screener",
		},
		{
			title: "Company Search",
			description:
				"Comprehensive company research platform with financial data, news, and analysis for informed investment decisions.",
			icon: <Search />,
			to: "/search",
		},
		{
			title: "Portfolio Analytics",
			description:
				"Real-time portfolio tracking, risk assessment, and performance analytics to optimize your investment strategy.",
			icon: <LineChart />,
		},
	];

	return (
		<section>
			<h2>Investment Tools & Analytics</h2>
			<div>
				{features.map((feature) => (
					<FeatureCard key={feature.title} {...feature} />
				))}
			</div>
		</section>
	);
}

function StatsSection() {
	const stats: StatCardProps[] = [
		{ value: "15.8%", label: "Average Annual Return" },
		{ value: "€2.4B", label: "Assets Under Management" },
		{ value: "500+", label: "Active Partners" },
	];

	return (
		<section>
			<Card>
				<CardHeader>
					<CardTitle>Partnership Performance</CardTitle>
				</CardHeader>
				<CardContent>
					<div>
						{stats.map((stat) => (
							<StatCard key={stat.label} {...stat} />
						))}
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

function CTASection() {
	return (
		<section>
			<Card>
				<CardHeader>
					<CardTitle>Ready to Start Investing?</CardTitle>
					<CardDescription>
						Join our exclusive investment partnership and gain access to
						institutional-grade research and investment opportunities.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div>
						<Button render={<Link to="/contact" />}>
							<TrendingUp />
							Get Started
						</Button>
						<Button variant="outline" render={<Link to="/about" />}>
							Learn More About Us
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

function HomePage() {
	return (
		<main>
			<HeroSection />
			<Separator />
			<FeaturesSection />
			<Separator />
			<StatsSection />
			<Separator />
			<CTASection />
		</main>
	);
}

export default HomePage;
