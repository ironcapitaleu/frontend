"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

/**
 * A set of options where exactly one stays selected. base-ui moves the
 * selection with the arrow keys and keeps a single tab stop, so the group reads
 * as one control. A `name` submits the selected value with the form.
 *
 * Pass `value` with `onValueChange` to control it, or `defaultValue` to let it
 * hold its own state. `disabled` on the group turns off every option, and
 * `disabled` on one `RadioGroupItem` turns off that option alone.
 *
 * Use it for a handful of options the reader compares side by side, such as a
 * reporting period. Past about six options, a `Select` reads better.
 */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
	return (
		<RadioGroupPrimitive
			data-slot="radio-group"
			className={cn("grid gap-3", className)}
			{...props}
		/>
	);
}

/**
 * One option in a `RadioGroup`, identified by its `value`. It renders the dot
 * alone, so pair it with a `Label` that points at its `id` to give it text.
 */
function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
	return (
		<RadioPrimitive.Root
			data-slot="radio-group-item"
			className={cn(
				"border-input focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-primary flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<RadioPrimitive.Indicator
				data-slot="radio-group-indicator"
				className="bg-primary block size-2 rounded-full"
			/>
		</RadioPrimitive.Root>
	);
}

export { RadioGroup, RadioGroupItem };
