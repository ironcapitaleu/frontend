import { cva, type VariantProps } from "class-variance-authority";

/** The marker that sits on the track at the position of the value. */
const rangeBarMarkerVariants = cva(
	"absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground",
	{
		variants: {
			size: {
				// A table cell or a card.
				sm: "size-2",
				// A detail view, such as the company preview.
				md: "size-2.5",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

/** The two bound labels below the track. */
const rangeBarBoundsVariants = cva(
	"flex justify-between gap-2 font-monospace text-muted-foreground",
	{
		variants: {
			size: {
				sm: "text-10",
				md: "text-11",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

/**
 * The dash drawn in place of the track for a missing value. It takes the
 * bounds' size, so it never reads larger than the numbers under it.
 */
const rangeBarMissingVariants = cva(
	"absolute inset-0 flex items-center justify-center font-monospace leading-none text-muted-foreground",
	{
		variants: {
			size: {
				sm: "text-10",
				md: "text-11",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

// The one `size` prop drives the marker, the bounds, and the missing dash, so
// the type requires a size to exist in every variant map.
type RangeBarVariants = VariantProps<typeof rangeBarMarkerVariants> &
	VariantProps<typeof rangeBarBoundsVariants> &
	VariantProps<typeof rangeBarMissingVariants>;

/** A constant listing every size of the `RangeBar` component. */
const RANGE_BAR_SIZES = ["sm", "md"] as const;

export {
	RANGE_BAR_SIZES,
	type RangeBarVariants,
	rangeBarBoundsVariants,
	rangeBarMarkerVariants,
	rangeBarMissingVariants,
};
