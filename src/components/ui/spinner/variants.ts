import { cva, type VariantProps } from "class-variance-authority";

/**
 * Size variants for the `Spinner`. The value maps to the SVG's width and height;
 * `default` is sized to sit beside body text, with smaller and larger steps for
 * inline labels and full-panel loading states.
 */
const spinnerVariants = cva("animate-spin text-muted-foreground", {
	variants: {
		size: {
			sm: "size-4",
			default: "size-6",
			lg: "size-8",
			xl: "size-12",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

type SpinnerVariants = VariantProps<typeof spinnerVariants>;

export { spinnerVariants, type SpinnerVariants };
