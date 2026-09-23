import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { type SheetContentVariants, sheetContentVariants } from "./variants";

/**
 * A panel that slides in from an edge of the screen over a dimmed page. It is
 * a modal dialog: focus moves into it and stays there, Escape and a click on
 * the backdrop close it, and focus returns to the trigger afterwards.
 *
 * Use it for a secondary task that keeps the page in view, such as a company
 * preview or a filter panel on a phone. Use an `AlertDialog` for a
 * decision the reader must confirm.
 */
function Sheet({ ...props }: SheetPrimitive.Root.Props) {
	return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/** The element that opens the sheet. */
function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
	return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/** An element that closes the sheet. */
function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/**
 * The sheet panel, with its backdrop and portal. A sheet floats above the
 * page, so it is one of the few surfaces that casts a shadow (DESIGN.md §4).
 * A close button sits in the top-right corner unless `showCloseButton` is
 * `false`.
 */
function SheetContent({
	className,
	children,
	side,
	showCloseButton = true,
	...props
}: SheetPrimitive.Popup.Props &
	SheetContentVariants & { showCloseButton?: boolean }) {
	return (
		<SheetPrimitive.Portal data-slot="sheet-portal">
			<SheetPrimitive.Backdrop
				data-slot="sheet-overlay"
				// The tint matches AlertDialog. The fade runs as long as the slide,
				// so the page dims while the panel travels.
				className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/10 duration-200 supports-backdrop-filter:backdrop-blur-xs"
			/>
			<SheetPrimitive.Popup
				data-slot="sheet-content"
				className={cn(sheetContentVariants({ side }), className)}
				{...props}
			>
				{children}
				{showCloseButton ? (
					<SheetPrimitive.Close
						data-slot="sheet-close-button"
						aria-label="Close"
						className="absolute top-4 right-4 inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<X className="size-4" aria-hidden="true" />
					</SheetPrimitive.Close>
				) : null}
			</SheetPrimitive.Popup>
		</SheetPrimitive.Portal>
	);
}

/** The sheet's name. Screen readers announce it when the sheet opens. */
function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
	return (
		<SheetPrimitive.Title
			data-slot="sheet-title"
			className={cn("text-foreground", className)}
			{...props}
		/>
	);
}

/** A short line that tells the reader what the sheet is for. */
function SheetDescription({
	className,
	...props
}: SheetPrimitive.Description.Props) {
	return (
		<SheetPrimitive.Description
			data-slot="sheet-description"
			className={cn("text-lg text-muted-foreground", className)}
			{...props}
		/>
	);
}

/** A padded block for the sheet's body. */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-body"
			className={cn("flex-1 overflow-y-auto p-6", className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
};
