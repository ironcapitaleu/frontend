"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { format as formatDate } from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { Button } from "../button";
import { cn } from "@/lib/utils";

/**
 * Renders the left and right chevrons in the calendar navigation. react-day-picker
 * asks for one component and tells it which way to point through `orientation`,
 * so this maps that to the matching lucide icon.
 */
function CalendarChevron({
	orientation,
}: {
	orientation?: "left" | "right" | "up" | "down";
}) {
	const Icon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
	return <Icon className="size-4" />;
}

/**
 * The grid of days, styled with the design system's semantic tokens so it
 * repaints with the theme. The selected day fills with the primary token, today
 * carries an accent ring, and days outside the month or disabled fade back.
 */
const calendarClassNames = {
	months: "relative flex flex-col gap-4",
	month: "flex w-full flex-col gap-4",
	nav: "absolute right-0 top-0 flex items-center gap-1",
	button_previous:
		"text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
	button_next:
		"text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
	month_caption: "flex h-7 items-center justify-start",
	caption_label: "text-sm font-medium",
	month_grid: "w-full border-collapse",
	weekdays: "flex",
	weekday: "text-muted-foreground w-8 text-[0.8rem] font-normal",
	week: "mt-1 flex w-full",
	day: "size-8 p-0 text-center text-sm",
	day_button:
		"hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-8 items-center justify-center rounded-md font-normal transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
	selected:
		"[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90 [&>button]:hover:text-primary-foreground",
	today: "[&>button]:border-accent-foreground/40 [&>button]:border",
	outside: "text-muted-foreground opacity-50",
	disabled: "text-muted-foreground opacity-50",
	hidden: "invisible",
} as const;

type DatePickerProps = {
	/** The selected date in a controlled picker. Pair it with `onValueChange`. */
	value?: Date;
	/** The date the picker starts on when it manages its own state. */
	defaultValue?: Date;
	/** Runs with the new date on every pick, or `undefined` when the reader clears it. */
	onValueChange?: (date: Date | undefined) => void;
	/** Stops the picker from opening and dims the trigger. */
	disabled?: boolean;
	/** The trigger text before the reader picks a date. */
	placeholder?: string;
	/** A date-fns format string for the trigger label. Defaults to a long date. */
	dateFormat?: string;
	/** Forwarded to the trigger button, so a `Label` can point at the picker. */
	id?: string;
	/** Extra classes for the trigger button. */
	className?: string;
};

/**
 * A themed control for picking one date. It reads as an outline button that
 * shows the chosen date, and opens a calendar in a popover. Drive it as a
 * controlled field with `value` and `onValueChange`, or let it hold its own
 * state through `defaultValue`.
 *
 * Reach for it wherever a filter or form needs a single date, such as a filing
 * date. The trigger and the calendar read from semantic tokens, so both track
 * the theme. Pass `disabled` to lock it, and a `placeholder` for the empty state.
 */
function DatePicker({
	value,
	defaultValue,
	onValueChange,
	disabled = false,
	placeholder = "Pick a date",
	dateFormat = "PPP",
	id,
	className,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const [internalDate, setInternalDate] = useState<Date | undefined>(
		defaultValue,
	);

	const selectedDate = value ?? internalDate;

	const handleSelect = (date: Date | undefined) => {
		setInternalDate(date);
		onValueChange?.(date);
		setOpen(false);
	};

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
			<PopoverPrimitive.Trigger
				render={
					<Button
						id={id}
						variant="outline"
						disabled={disabled}
						data-slot="date-picker-trigger"
						data-empty={selectedDate ? undefined : true}
						className={cn(
							"w-56 justify-start font-normal data-empty:text-muted-foreground",
							className,
						)}
					/>
				}
			>
				<CalendarIcon className="text-muted-foreground" />
				{selectedDate ? formatDate(selectedDate, dateFormat) : placeholder}
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Positioner
					side="bottom"
					sideOffset={4}
					align="start"
					className="isolate z-50"
				>
					<PopoverPrimitive.Popup
						data-slot="date-picker-content"
						className={cn(
							"bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 origin-(--transform-origin) rounded-lg p-3 shadow-md ring-1 duration-100",
						)}
					>
						<DayPicker
							mode="single"
							selected={selectedDate}
							onSelect={handleSelect}
							showOutsideDays
							classNames={calendarClassNames}
							components={{ Chevron: CalendarChevron }}
						/>
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}

export { DatePicker };
export type { DatePickerProps };
