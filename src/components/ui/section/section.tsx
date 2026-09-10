import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("w-full px-6", {
	variants: {
		// Vertical rhythm of the band.
		spacing: {
			default: "py-16",
			lg: "py-20",
			xl: "py-24",
		},
		// Hairline rule that separates one band from the next.
		divider: {
			none: "",
			top: "border-t border-border/50",
			bottom: "border-b border-border/50",
		},
	},
	defaultVariants: {
		spacing: "default",
		divider: "none",
	},
});

const containerVariants = cva("mx-auto w-full", {
	variants: {
		// Reading measure of the column.
		width: {
			prose: "max-w-prose",
			wide: "max-w-6xl",
		},
	},
	defaultVariants: {
		width: "prose",
	},
});

/**
 * A full-width page band with consistent horizontal padding, a vertical
 * rhythm, and an optional hairline divider. Pair it with `Container` to hold
 * the reading column.
 */
function Section({
	className,
	spacing,
	divider,
	...props
}: React.ComponentProps<"section"> & VariantProps<typeof sectionVariants>) {
	return (
		<section
			data-slot="section"
			className={cn(sectionVariants({ spacing, divider }), className)}
			{...props}
		/>
	);
}

/**
 * A centered reading column that caps line length. Sits inside a `Section` and
 * holds the page copy.
 */
function Container({
	className,
	width,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
	return (
		<div
			data-slot="container"
			className={cn(containerVariants({ width }), className)}
			{...props}
		/>
	);
}

export { Section, Container, sectionVariants, containerVariants };

/** Spacing options for the `Section` band. */
export const SECTION_SPACINGS = ["default", "lg", "xl"] as const;

/** Divider options for the `Section` band. */
export const SECTION_DIVIDERS = ["none", "top", "bottom"] as const;

/** Width options for the `Container` reading column. */
export const CONTAINER_WIDTHS = ["prose", "wide"] as const;
