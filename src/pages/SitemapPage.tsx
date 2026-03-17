import { Link } from "react-router-dom";

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
			<h2 className="text-3xl font-semibold uppercase tracking-widest text-foreground">
				{title}
			</h2>
			<ul className="flex flex-col gap-3 list-none m-0 p-0">
				{links.map(({ label, to }) => (
					<li key={to}>
						<Link
							to={to}
							className="text-sm font-medium text-foreground hover:text-primary transition-colors"
						>
							{label}
						</Link>
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
		<section className="px-6 py-20 border-b border-border/50">
			<div className="max-w-6xl mx-auto">
				<h1 className="font-classic font-semibold text-4xl md:text-5xl text-foreground">
					Sitemap
				</h1>
			</div>
		</section>
	);
}

function LinksSection() {
	return (
		<section className="px-6 py-16">
			<div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
				{SITEMAP_SECTIONS.map((section) => (
					<SitemapSection key={section.title} {...section} />
				))}
			</div>
		</section>
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
