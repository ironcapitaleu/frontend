import { Link } from "react-router";

import { Heading } from "@/components/ui/heading";
import { Container, Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text";

interface SitemapLink {
	label: string;
	to: string;
}

interface SitemapSectionProps {
	title: string;
	links: SitemapLink[];
}

function SitemapSection({ title, links }: SitemapSectionProps) {
	return (
		<div className="flex flex-col gap-4">
			<Heading variant="overline">{title}</Heading>
			<ul className="flex flex-col gap-3 list-none m-0 p-0">
				{links.map(({ label, to }) => (
					<li key={to}>
						<TextLink
							render={<Link to={to} />}
							variant="subtle"
							className="text-sm font-medium"
						>
							{label}
						</TextLink>
					</li>
				))}
			</ul>
		</div>
	);
}

const SITEMAP_SECTIONS: SitemapSectionProps[] = [
	{
		title: "Iron Capital",
		links: [
			{ label: "Home", to: "/" },
			{ label: "About", to: "/about" },
			{ label: "Contact", to: "/contact" },
			{ label: "Privacy Policy", to: "/privacy" },
		],
	},
	{
		title: "Tools",
		links: [
			{ label: "Screener", to: "/screener" },
			{ label: "API", to: "/api" },
		],
	},
	{
		title: "Account",
		links: [{ label: "Sign In", to: "/login" }],
	},
];

function HeroSection() {
	return (
		<Section spacing="lg" divider="bottom">
			<Container width="wide">
				<Heading level={1} variant="page">
					Sitemap
				</Heading>
			</Container>
		</Section>
	);
}

function LinksSection() {
	return (
		<Section>
			<Container
				width="wide"
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12"
			>
				{SITEMAP_SECTIONS.map((section) => (
					<SitemapSection key={section.title} {...section} />
				))}
			</Container>
		</Section>
	);
}

function SitemapPage() {
	return (
		<>
			<HeroSection />
			<LinksSection />
		</>
	);
}

export default SitemapPage;
