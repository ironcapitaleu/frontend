"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

/**
 * Shares one hover delay across every tooltip below it. Once one tooltip
 * opens, the neighbouring ones open at once, so a row of metrics does not make
 * the reader wait again on each cell.
 *
 * `Tooltip` mounts its own provider, so reach for this only to group several
 * tooltips under one delay.
 */
function TooltipProvider({
	delay = 0,
	...props
}: TooltipPrimitive.Provider.Props) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delay={delay}
			{...props}
		/>
	);
}

/**
 * A small overlay that reveals extra detail about the element it wraps, on
 * hover and on keyboard focus. base-ui drives both triggers, so a mouse and the
 * Tab key both open it. Pair one `TooltipTrigger` with one `TooltipContent`.
 *
 * Use it for a hint that helps but is not required to read the page, such as
 * the full name behind an abbreviated financial-statement metric. Never hide
 * text that the reader must have inside a tooltip.
 */
function Tooltip(props: TooltipPrimitive.Root.Props) {
	return (
		<TooltipProvider>
			<TooltipPrimitive.Root data-slot="tooltip" {...props} />
		</TooltipProvider>
	);
}

/**
 * The element that opens the tooltip on hover or focus. It renders a button by
 * default. Pass a `render` prop to turn an existing element into the trigger,
 * such as a metric label or an icon.
 */
function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/**
 * The floating panel that holds the tooltip text, with an arrow that points
 * back at the trigger. `side` places it above, below, or beside the trigger and
 * flips to stay on screen. `sideOffset` sets the gap from the trigger.
 */
function TooltipContent({
	className,
	side = "top",
	sideOffset = 8,
	children,
	...props
}: TooltipPrimitive.Popup.Props &
	Pick<TooltipPrimitive.Positioner.Props, "side" | "sideOffset" | "align">) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				side={side}
				sideOffset={sideOffset}
				align={props.align}
				className="isolate z-50"
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					className={cn(
						"bg-primary text-primary-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-fit origin-(--transform-origin) rounded-md px-3 py-1.5 text-xs text-balance shadow-md duration-100",
						className,
					)}
					{...props}
				>
					{children}
					<TooltipPrimitive.Arrow className="bg-primary z-50 size-2.5 rotate-45 rounded-[2px] data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1" />
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
