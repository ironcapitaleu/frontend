import { cva } from "class-variance-authority";

export const textVariants = cva("leading-relaxed", {
	variants: {
		// Font role: the classical voice or the plain working sans.
		font: {
			classic: "font-classic",
			sans: "",
		},
		// Type size, from a small caption up to a hero statement.
		size: {
			sm: "text-sm",
			base: "",
			lg: "text-lg",
			display: "text-5xl md:text-7xl font-medium leading-tight",
		},
		// Ink weight of the copy.
		tone: {
			muted: "text-muted-foreground",
			foreground: "text-foreground",
			default: "",
		},
	},
	defaultVariants: {
		font: "classic",
		size: "base",
		tone: "muted",
	},
});

export const textLinkVariants = cva("transition-colors", {
	variants: {
		// Inline link treatment.
		variant: {
			// Underlined link inside running copy.
			underline: "underline hover:text-foreground",
			// Quiet link that warms to the accent on hover.
			subtle: "text-foreground hover:text-primary",
		},
	},
	defaultVariants: {
		variant: "underline",
	},
});

/** Font roles available on the `Text` component. */
export const TEXT_FONTS = ["classic", "sans"] as const;

/** Sizes available on the `Text` component. */
export const TEXT_SIZES = ["sm", "base", "lg", "display"] as const;

/** Tones available on the `Text` component. */
export const TEXT_TONES = ["muted", "foreground", "default"] as const;

/** A constant describing all available variants of the `TextLink` component. */
export const TEXT_LINK_VARIANTS = ["underline", "subtle"] as const;
