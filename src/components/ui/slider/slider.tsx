"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/**
 * A track the reader drags to pick a number, or a range when it carries two
 * values. base-ui handles pointer drag, arrow keys, and the hidden inputs, so a
 * `name` makes the slider part of a form.
 *
 * Pass a single number for one thumb and an array for a range. `value` with
 * `onValueChange` controls it, `defaultValue` lets it hold its own state.
 * `min`, `max`, and `step` bound the numbers it can reach.
 *
 * Use it where the exact figure matters less than its place in a range, such as
 * a market-cap filter. When the reader needs a precise entry, pair it with a
 * number input or use one instead.
 */
function Slider({
	className,
	value,
	defaultValue,
	min = 0,
	max = 100,
	...props
}: SliderPrimitive.Root.Props) {
	const thumbCount = countThumbs(value ?? defaultValue);

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			value={value}
			defaultValue={defaultValue}
			min={min}
			max={max}
			{...props}
		>
			<SliderPrimitive.Control
				data-slot="slider-control"
				className={cn(
					"relative flex w-full touch-none items-center py-2 select-none data-disabled:opacity-50 data-[orientation=vertical]:h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2",
					className,
				)}
			>
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="bg-input relative h-1.5 w-full grow overflow-hidden rounded-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
				>
					<SliderPrimitive.Indicator
						data-slot="slider-indicator"
						className="bg-primary absolute rounded-full"
					/>
				</SliderPrimitive.Track>
				{Array.from({ length: thumbCount }, (_unused, index) => (
					<SliderPrimitive.Thumb
						// biome-ignore lint/suspicious/noArrayIndexKey: base-ui identifies a thumb by its index in the value array
						key={index}
						index={index}
						data-slot="slider-thumb"
						className="bg-background border-primary focus-visible:ring-ring/50 block size-4 shrink-0 rounded-full border-2 shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] data-disabled:pointer-events-none"
					/>
				))}
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

/** Counts the thumbs a value needs: one per entry of a range, one otherwise. */
function countThumbs(value: number | readonly number[] | undefined): number {
	return Array.isArray(value) ? value.length : 1;
}

export { Slider };
