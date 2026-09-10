import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";

import { headingVariants } from "./variants";
import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A typographic heading that carries the classical voice of the product. The
 * `level` prop sets the document level (the rendered `<h1>`–`<h6>`) so the
 * outline stays correct while the look is chosen by `variant`. Defaults to an
 * `<h2>`. Pass `render` for full control over the element.
 */
function Heading({
	className,
	variant = "section",
	level = 2,
	render,
	...props
}: useRender.ComponentProps<"h2"> &
	VariantProps<typeof headingVariants> & { level?: HeadingLevel }) {
	return useRender({
		defaultTagName: `h${level}` as const,
		props: mergeProps<"h2">(
			{
				className: cn(headingVariants({ className, variant })),
			},
			props,
		),
		render,
		state: {
			slot: "heading",
			variant,
		},
	});
}

export { Heading, headingVariants };
