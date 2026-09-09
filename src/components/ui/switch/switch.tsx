"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

/**
 * A two-state control that turns one setting on or off, with the change taking
 * effect at once. base-ui renders a hidden `<input>` beside it, so a `name`
 * makes the switch part of a form and the keyboard toggles it with Space.
 *
 * Reach for a switch when the setting acts the moment it flips, such as a live
 * data feed in a filter panel. For a choice that only counts once the reader
 * submits the form, use a checkbox instead.
 *
 * Pass `checked` with `onCheckedChange` to control it, or `defaultChecked` to
 * let it hold its own state. Give it a visible `Label` through `htmlFor`, or an
 * `aria-label` when no text sits beside it.
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				"peer data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-px shadow-xs outline-none transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform duration-150 ease-out data-checked:translate-x-4 data-unchecked:translate-x-0"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
