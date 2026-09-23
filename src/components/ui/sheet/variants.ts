import { cva, type VariantProps } from "class-variance-authority";

import type { Assert, SameMembers } from "@/lib/types";

/**
 * The panel: which edge it enters from, and how it sizes along that edge. The
 * bare `slide-in-from-right` form of tw-animate-css moves the panel by its full
 * width (100%), so it enters from off screen.
 */
const sheetContentVariants = cva(
	"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed z-50 flex flex-col bg-background shadow-lg outline-none duration-200",
	{
		variants: {
			side: {
				right:
					"inset-y-0 right-0 h-full w-full border-l border-border data-open:slide-in-from-right data-closed:slide-out-to-right sm:max-w-md",
				left: "inset-y-0 left-0 h-full w-full border-r border-border data-open:slide-in-from-left data-closed:slide-out-to-left sm:max-w-sm",
				bottom:
					"inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl border-t border-border data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
			},
		},
		defaultVariants: {
			side: "right",
		},
	},
);

type SheetContentVariants = VariantProps<typeof sheetContentVariants>;

/** A constant listing every edge a `Sheet` can enter from. */
const SHEET_SIDES = ["right", "left", "bottom"] as const;

// Fails the type check when an edge exists in `sheetContentVariants` and not
// in `SHEET_SIDES`, or the other way round, so the two lists cannot drift.
type SheetSidesListed = Assert<
	SameMembers<
		NonNullable<SheetContentVariants["side"]>,
		(typeof SHEET_SIDES)[number]
	>
>;

export {
	SHEET_SIDES,
	type SheetContentVariants,
	type SheetSidesListed,
	sheetContentVariants,
};
