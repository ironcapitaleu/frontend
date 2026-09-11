import { Link } from "react-router";

import { Heading } from "@/components/ui/heading";
import { Container, Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text";
import { discoverSitemapMembers, type SitemapMember } from "./sitemap";

// The order the group headings appear in. A member whose group is not listed
// here would not render, so sitemap.test.ts checks the rendered links against
// the registry and fails if a new group is missing from this list.
const GROUP_ORDER = ["Iron Capital", "Tools", "More"];

interface SitemapSectionProps {
	title: string;
	links: SitemapMember[];
}

function SitemapSection({ title, links }: SitemapSectionProps) {
	return (
		<div className="flex flex-col gap-4">
			<Heading variant="overline">{title}</Heading>
			<ul className="flex flex-col gap-3 list-none m-0 p-0">
				{links.map(({ label, path }) => (
					<li key={path}>
						<TextLink
							render={<Link to={path} />}
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
	// The sitemap page is generated from the discovered registry members, so it
	// stays in step with the real pages without a hand-maintained list here.
	const members = discoverSitemapMembers();
	const sections = GROUP_ORDER.map((title) => ({
		title,
		links: members.filter((member) => member.group === title),
	})).filter((section) => section.links.length > 0);

	return (
		<Section>
			<Container
				width="wide"
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12"
			>
				{sections.map((section) => (
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
