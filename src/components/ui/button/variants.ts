import { cva } from "class-variance-authority";

export const buttonVariants = cva(
	"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
	{
		variants: {
			variant: {
				// Background, text color, hover state
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				// Border, background, hover, dark mode, aria-expanded state
				outline:
					"border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
				// Background, text color, hover, aria-expanded state
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				// Hover, dark mode hover, aria-expanded state
				ghost:
					"hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
				// Destructive background, hover, focus ring, dark mode, text color
				destructive:
					"bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
				// Text color, underline on hover
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				// Height, gap, padding, inline icon padding adjustments
				default:
					"h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				// Extra small: reduced height, gap, padding, font size, icon size, button-group rounding
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				// Small: slightly reduced height, gap, padding, font size, icon size, button-group rounding
				sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				// Large: increased height, inline icon padding adjustments
				lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				// Square icon-only button (default size)
				icon: "size-8",
				// Square icon-only button (extra small), button-group rounding, smaller icon
				"icon-xs":
					"size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
				// Square icon-only button (small), button-group rounding
				"icon-sm":
					"size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
				// Square icon-only button (large)
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

/** A constant describing all available variants of the Button component. */
export const BUTTON_VARIANTS = [
	"default",
	"destructive",
	"outline",
	"secondary",
	"ghost",
	"link",
] as const;

/** A constant containing all sizes available for buttons with text content (non-icon buttons). */
export const BUTTON_TEXT_SIZES = ["xs", "sm", "default", "lg"] as const;

/** A constant containing all sizes available for buttons with icon content. */
export const BUTTON_ICON_SIZES = [
	"icon-xs",
	"icon-sm",
	"icon",
	"icon-lg",
] as const;

/** A constant containing all sizes available for all types of buttons. */
export const BUTTON_SIZES = [
	...BUTTON_TEXT_SIZES,
	...BUTTON_ICON_SIZES,
] as const;
