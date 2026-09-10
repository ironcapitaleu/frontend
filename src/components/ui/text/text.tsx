import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";

import { textLinkVariants, textVariants } from "./variants";
import { cn } from "@/lib/utils";

/**
 * A paragraph of copy with the house font, size, and tone. Renders a `<p>` by
 * default. Pass `render` for another element (for example `render={<span />}`).
 */
function Text({
	className,
	font,
	size,
	tone,
	render,
	...props
}: useRender.ComponentProps<"p"> & VariantProps<typeof textVariants>) {
	return useRender({
		defaultTagName: "p",
		props: mergeProps<"p">(
			{
				className: cn(textVariants({ className, font, size, tone })),
			},
			props,
		),
		render,
		state: {
			slot: "text",
		},
	});
}

/**
 * An inline link for running copy. Renders an `<a>` by default. Pass `render`
 * to route through the client (for example `render={<Link to="/contact" />}`).
 */
function TextLink({
	className,
	variant = "underline",
	render,
	...props
}: useRender.ComponentProps<"a"> & VariantProps<typeof textLinkVariants>) {
	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				className: cn(textLinkVariants({ className, variant })),
			},
			props,
		),
		render,
		state: {
			slot: "text-link",
			variant,
		},
	});
}

export { Text, TextLink, textVariants, textLinkVariants };
