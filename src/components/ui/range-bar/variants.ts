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

// The one `size` prop drives both the marker and the bounds, so the type
// requires a size to exist in both variant maps.
type RangeBarVariants = VariantProps<typeof rangeBarMarkerVariants> &
	VariantProps<typeof rangeBarBoundsVariants>;

/** A constant listing every size of the `RangeBar` component. */
const RANGE_BAR_SIZES = ["sm", "md"] as const;

export {
	RANGE_BAR_SIZES,
	type RangeBarVariants,
	rangeBarBoundsVariants,
	rangeBarMarkerVariants,
};
