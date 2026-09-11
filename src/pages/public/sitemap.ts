// The sitemap registry and page discovery.
//
// The sitemap must list every public page and nothing else. Three sources have
// to agree: the page modules that exist under src/pages/public/, the URLs in
// public/sitemap.xml, and the links the sitemap page renders. Keeping them in
// sync by hand is the convention that used to live only in AGENTS.md. This
// module makes the registry below the single source of truth, and sitemap.test.ts
// locks the other sources to it.
//
// How a page joins the sitemap: add its module to SITEMAP_MEMBERS and add its
// URL to public/sitemap.xml. A page that must NOT appear in the sitemap (an
// auth-only page, or the catch-all 404) belongs in src/pages/internal/, a
// sibling of src/pages/public/ that discovery does not scan. Forgetting either
// step fails the test, so the sitemap cannot drift out of sync in silence.

export interface SitemapMember {
	/** The page module's file name without extension, e.g. "AboutPage". */
	module: string;
	/** The route path the page is served at, e.g. "/about". */
	path: string;
	/** The human label the sitemap page shows for the link. */
	label: string;
	/** The heading the sitemap page groups this link under. */
	group: string;
}

// The registry: every public page, registered by hand. This is the source of
// truth. The sitemap page renders from it, and the sitemap XML is checked
// against it. An entry with no page file, or a page file with no entry, fails
// sitemap.test.ts.
export const SITEMAP_MEMBERS: SitemapMember[] = [
	{ module: "HomePage", path: "/", label: "Home", group: "Iron Capital" },
	{
		module: "AboutPage",
		path: "/about",
		label: "About",
		group: "Iron Capital",
	},
	{
		module: "ContactPage",
		path: "/contact",
		label: "Contact",
		group: "Iron Capital",
	},
	{
		module: "PrivacyPage",
		path: "/privacy",
		label: "Privacy Policy",
		group: "Iron Capital",
	},
	{ module: "CompanySearch", path: "/search", label: "Search", group: "Tools" },
	{
		module: "StockScreener",
		path: "/screener",
		label: "Screener",
		group: "Tools",
	},
	{ module: "SitemapPage", path: "/sitemap", label: "Sitemap", group: "More" },
];

// Every top-level *.tsx here (src/pages/public/), minus its test and story
// companions. The glob is relative to this file, so it scans only this folder:
// a top-level .tsx here is treated as a public page, and sibling folders like
// src/pages/internal/ sit outside it. Discovery reads only the keys (file
// paths), so the circular import with SitemapPage is harmless: no page module is
// dereferenced here. `eager` matches how App.tsx already imports every page
// statically, which avoids an ineffective dynamic-import chunk at build time.
const PAGE_FILES = import.meta.glob(
	["./*.tsx", "!./*.test.tsx", "!./*.stories.tsx"],
	{ eager: true },
);

/**
 * The page module names that actually exist at the top level of
 * src/pages/public/, sorted. This is the "discovered" set the registry is
 * checked against.
 */
export function discoverPageModules(): string[] {
	return Object.keys(PAGE_FILES)
		.map((file) => file.replace(/^\.\//, "").replace(/\.tsx$/, ""))
		.sort();
}

/**
 * The registered members whose page file is present, in registry order. The
 * sitemap page renders from this, so it can only ever show pages that exist and
 * are registered. sitemap.test.ts proves the discovered set and the registry
 * match, so in a healthy tree this returns the whole registry.
 */
export function discoverSitemapMembers(): SitemapMember[] {
	const present = new Set(discoverPageModules());
	return SITEMAP_MEMBERS.filter((member) => present.has(member.module));
}
