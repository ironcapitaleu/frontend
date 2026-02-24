import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "./variants";
import { cn } from "@/lib/utils";

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button };

// Export variant keys for Storybook
export const BUTTON_VARIANTS = [
	"default",
	"destructive",
	"outline",
	"secondary",
	"ghost",
	"link",
] as const;
export const BUTTON_TEXT_SIZES = ["xs", "sm", "default", "lg"] as const;
export const BUTTON_ICON_SIZES = [
	"icon-xs",
	"icon-sm",
	"icon",
	"icon-lg",
] as const;
export const BUTTON_SIZES = [
	...BUTTON_TEXT_SIZES,
	...BUTTON_ICON_SIZES,
] as const;
