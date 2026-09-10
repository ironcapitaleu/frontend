import { cva } from "class-variance-authority";

export const headingVariants = cva("text-foreground", {
	variants: {
		// Visual role of the heading, from the largest classical title down to
		// the small uppercase label.
		variant: {
			// Classical page title (the Privacy and Sitemap heroes).
			page: "font-classic text-4xl md:text-5xl font-semibold",
			// A prominent classical section title.
			feature: "font-classic text-5xl font-semibold",
			// A standard classical section title.
			section: "font-classic text-2xl font-semibold",
			// A quieter classical sub-heading.
			subsection: "font-classic font-medium",
			// An uppercase label that groups a list.
			overline: "text-3xl font-semibold uppercase tracking-widest",
			// A serif hero title for the working, modern pages.
			hero: "font-serif text-5xl font-medium tracking-tight",
		},
	},
	defaultVariants: {
		variant: "section",
	},
});

/** A constant describing all available variants of the `Heading` component. */
export const HEADING_VARIANTS = [
	"page",
	"feature",
	"section",
	"subsection",
	"overline",
	"hero",
] as const;
