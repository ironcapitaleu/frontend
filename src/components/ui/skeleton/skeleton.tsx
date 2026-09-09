import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `Skeleton` is a placeholder box that pulses while real content loads. It holds
 * the layout so the page does not jump when the data arrives.
 *
 * Size and shape come from the consumer's `className`: width, height, and a
 * `rounded-*` or `rounded-full` radius. The primitive stays one neutral shape
 * that a page composes into text lines, avatars, or cards.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-muted", className)}
			{...props}
		/>
	);
}

export { Skeleton };
