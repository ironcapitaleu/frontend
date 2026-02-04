import { Link } from "react-router-dom";

import { BarChart3, Eye, Shield, TrendingUp, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ValueCardProps {
	title: string;
	description: string;
	icon: React.ReactNode;
}

function ValueCard({ title, description, icon }: ValueCardProps) {
	return (
		<Card>
			<CardHeader>
				<div>{icon}</div>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
		</Card>
	);
}

interface TeamMemberProps {
	name: string;
	role: string;
	bio: string;
}

function TeamMember({ name, role, bio }: TeamMemberProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{name}</CardTitle>
				<CardDescription>{role}</CardDescription>
			</CardHeader>
			<CardContent>
				<p>{bio}</p>
			</CardContent>
		</Card>
	);
}

function HeroSection() {
	return (
		<section>
			<h1>About Iron Capital</h1>
			<p>
				Iron Capital is a premier investment partnership dedicated to delivering
				exceptional returns through strategic analysis, cutting-edge technology,
				and disciplined risk management. Founded on principles of transparency
				and excellence.
			</p>
		</section>
	);
}

function MissionVisionSection() {
	return (
		<section>
			<Card>
				<CardHeader>
					<div>
						<Zap />
					</div>
					<CardTitle>Our Mission</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						To democratize institutional-grade investment research and provide
						our partners with the tools and insights needed to make informed
						investment decisions in today's complex financial markets.
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<div>
						<Eye />
					</div>
					<CardTitle>Our Vision</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						To become Europe's leading investment partnership by combining
						traditional investment wisdom with innovative technology, creating
						sustainable wealth for our partners while maintaining the highest
						ethical standards.
					</p>
				</CardContent>
			</Card>
		</section>
	);
}

function ApproachSection() {
	const approaches: ValueCardProps[] = [
		{
			title: "Data-Driven Analysis",
			description:
				"We leverage advanced analytics and quantitative models to identify market opportunities and assess risk across all asset classes.",
			icon: <BarChart3 />,
		},
		{
			title: "Risk Management",
			description:
				"Comprehensive risk assessment and portfolio diversification strategies protect capital while maximizing potential returns.",
			icon: <Shield />,
		},
		{
			title: "Long-term Focus",
			description:
				"We prioritize sustainable, long-term growth over short-term gains, building wealth through patient and strategic investing.",
			icon: <TrendingUp />,
		},
	];

	return (
		<section>
			<h2>Our Investment Approach</h2>
			<div>
				{approaches.map((approach) => (
					<ValueCard key={approach.title} {...approach} />
				))}
			</div>
		</section>
	);
}

function TeamSection() {
	const team: TeamMemberProps[] = [
		{
			name: "Alexander Schmidt",
			role: "Founder & Chief Investment Officer",
			bio: "20+ years in institutional investment management with expertise in European equities and alternative investments.",
		},
		{
			name: "Dr. Maria Weber",
			role: "Head of Quantitative Research",
			bio: "PhD in Financial Mathematics from ETH Zürich. Previously led quantitative strategies at major European banks.",
		},
		{
			name: "Thomas Müller",
			role: "Head of Risk Management",
			bio: "Former risk management director at a leading Swiss private bank with expertise in portfolio risk optimization.",
		},
	];

	return (
		<section>
			<h2>Leadership Team</h2>
			<div>
				{team.map((member) => (
					<TeamMember key={member.name} {...member} />
				))}
			</div>
		</section>
	);
}

function ValuesSection() {
	const values: ValueCardProps[] = [
		{
			title: "Transparency",
			description:
				"Complete openness about our strategies, fees, and performance metrics.",
			icon: <Eye />,
		},
		{
			title: "Excellence",
			description:
				"Continuous pursuit of superior investment outcomes and client service.",
			icon: <TrendingUp />,
		},
		{
			title: "Partnership",
			description:
				"Your success is our success. We align our interests with our partners.",
			icon: <Users />,
		},
	];

	return (
		<section>
			<h2>Our Values</h2>
			<div>
				{values.map((value) => (
					<ValueCard key={value.title} {...value} />
				))}
			</div>
		</section>
	);
}

function CTASection() {
	return (
		<section>
			<Card>
				<CardHeader>
					<CardTitle>Ready to Partner with Us?</CardTitle>
					<CardDescription>
						Schedule a consultation to learn how Iron Capital can help you
						achieve your investment goals.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button render={<Link to="/contact" />}>Contact Us</Button>
				</CardContent>
			</Card>
		</section>
	);
}

function AboutPage() {
	return (
		<main>
			<HeroSection />
			<Separator />
			<MissionVisionSection />
			<Separator />
			<ApproachSection />
			<Separator />
			<TeamSection />
			<Separator />
			<ValuesSection />
			<Separator />
			<CTASection />
		</main>
	);
}

export default AboutPage;
