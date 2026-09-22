import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface FilterChipProps
	extends Omit<React.ComponentProps<"span">, "children"> {
	/** Names the filter, for example "P/E". */
	label: string;
	/** The bound in mono, for example `≤ 20`. Leave it empty for a switch. */
	value?: string;
	/** Called when the reader removes the filter. */
	onRemove: () => void;
}

/**
 * A small chip that names one active filter and offers a button to remove it.
 * The screener shows one chip per active filter above the results, so the
 * reader always sees what narrows the list and undoes one criterion in one
 * click.
 *
 * The remove button is labelled "Remove {label} filter". Its hit area is 44 by
 * 44 px. It grows left over the chip and 8 px above and below it, but never
 * past the chip's right edge, so a neighboring chip keeps its own clicks. Leave
 * at least 8 px of clear space above and below a chip row. The chip holds no state, so `onRemove` can fire twice on a fast double
 * click, and the caller must tolerate removing a filter that is already gone.
 * Use a `Badge` for a label that the reader cannot remove.
 */
function FilterChip({
	label,
	value,
	onRemove,
	className,
	...props
}: FilterChipProps) {
	return (
		<span
			data-slot="filter-chip"
			className={cn(
				"inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border bg-muted pr-1 pl-2.5 text-base text-foreground",
				className,
			)}
			{...props}
		>
			<span className="truncate">{label}</span>
			{value ? <span className="shrink-0 font-monospace">{value}</span> : null}
			{/* A raw button, not the shared Button: its smallest icon size is 24 px,
			    which leaves 2 px above and below in the 28 px chip and swallows the
			    right padding. .btn-tactile's lift and shadow on a 20 px icon read as
			    jitter. The color change is the feedback. */}
			<button
				type="button"
				aria-label={`Remove ${label} filter`}
				onClick={onRemove}
				className="relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors outline-none after:absolute after:-inset-y-3 after:-right-1 after:-left-5 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				<X className="size-3" aria-hidden="true" />
			</button>
		</span>
	);
}

export { FilterChip, type FilterChipProps };
