import { cva, type VariantProps } from "class-variance-authority";

/**
 * Size variants for the `Progress` track. The value maps to the bar's height;
 * `default` suits inline use, `sm` for tight rows, `lg` for a prominent bar.
 */
const progressVariants = cva(
	"relative w-full overflow-hidden rounded-full bg-muted",
	{
		variants: {
			size: {
				sm: "h-1",
				default: "h-2",
				lg: "h-3",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

type ProgressVariants = VariantProps<typeof progressVariants>;

/**
 * Styles for the filled portion of the track. The width is set by base-ui from
 * the current value; the transition smooths that growth. When the value is
 * `null` the bar is indeterminate — it fills the track and pulses instead.
 */
const progressIndicatorStyles =
	"h-full rounded-full bg-primary transition-[width] duration-500 ease-out data-indeterminate:w-full data-indeterminate:animate-pulse";

export { progressVariants, progressIndicatorStyles, type ProgressVariants };
