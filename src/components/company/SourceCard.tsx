import { Popover } from "@base-ui/react/popover";
import * as React from "react";

import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { usePhone } from "@/hooks/usePhone";
import { formatDate } from "@/lib/company/dates";
import { documentLabel } from "@/lib/company/sources";
import type { Claim, ClaimId } from "@/lib/company/types";
import { cn } from "@/lib/utils";

/** How many inputs of a derived claim the card lists. It counts the rest. */
const LISTED_INPUTS = 10;

/** Props for {@link SourceCard}. */
interface SourceCardProps extends React.ComponentProps<"div"> {
	claim: Claim;
}

/**
 * The source card of one figure (DESIGN.md §8). A reported claim names its
 * document, the filing date, the line and the XBRL tag when the document has
 * one, and links to the exact document in the filing. A derived claim shows
 * its formula and an entry for each of its first ten inputs, and counts the
 * rest. Each input shows its own source. So a reader can follow any figure
 * down to reported lines.
 *
 * It renders the card body only. {@link SourceTrigger} opens it from a figure.
 */
function SourceCard({ claim, className, ...props }: SourceCardProps) {
	return (
		<div
			data-slot="source-card"
			className={cn("flex flex-col gap-3 text-base", className)}
			{...props}
		>
			<p className="font-serif text-lg">{claim.label}</p>
			<SourceOf claim={claim} />
		</div>
	);
}

/**
 * The source of `claim`. A derived claim walks its inputs down to reported
 * sources. `ancestors` holds the derived claims above `claim`, so a claim that
 * reaches itself stops with a note instead of walking forever.
 */
function SourceOf({
	claim,
	ancestors = [],
}: {
	claim: Claim;
	ancestors?: readonly ClaimId[];
}) {
	const { source } = claim;
	if (source.kind === "derived") {
		if (ancestors.includes(claim.id)) {
			return <p className="text-muted-foreground">(repeats above)</p>;
		}
		const walked = [...ancestors, claim.id];
		const unlisted = source.inputs.length - LISTED_INPUTS;
		return (
			<div className="flex flex-col gap-2">
				<dl className="grid grid-cols-[auto_1fr] gap-x-3">
					<dt className="text-muted-foreground">Formula</dt>
					<dd className="font-monospace">{source.formula}</dd>
				</dl>
				<ul
					aria-label={`Inputs of ${claim.label}`}
					className="flex flex-col gap-3 border-l border-border pl-3"
				>
					{source.inputs.slice(0, LISTED_INPUTS).map((input) => (
						<li key={input.id} className="flex flex-col gap-1">
							<span className="font-medium">{input.label}</span>
							<SourceOf claim={input} ancestors={walked} />
						</li>
					))}
				</ul>
				{unlisted > 0 && (
					<p className="text-muted-foreground">and {unlisted} more</p>
				)}
			</div>
		);
	}
	const { document } = source;
	const filing = document.kind === "filing";
	return (
		<div className="flex flex-col gap-2">
			<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
				<dt className="text-muted-foreground">{filing ? "Filing" : "Data"}</dt>
				<dd>{documentLabel(document)}</dd>
				<dt className="text-muted-foreground">{filing ? "Filed" : "As of"}</dt>
				<dd>
					{formatDate(
						filing ? document.filedOn : (claim.period?.endsOn ?? document.asOf),
					)}
				</dd>
				<dt className="text-muted-foreground">Line</dt>
				<dd>{source.line}</dd>
				{source.xbrlTag && (
					<>
						<dt className="text-muted-foreground">XBRL tag</dt>
						<dd className="font-monospace break-all">{source.xbrlTag}</dd>
					</>
				)}
			</dl>
			<a
				href={source.url}
				target="_blank"
				rel="noreferrer"
				className="text-primary underline underline-offset-4"
			>
				{filing ? "Open the filing on SEC EDGAR" : "Open the data source"}
			</a>
		</div>
	);
}

/** Props for {@link SourceTrigger}. */
interface SourceTriggerProps {
	claim: Claim;
	/** The figure, as the page draws it. */
	children: React.ReactNode;
	className?: string;
	/** Places the trigger, such as a stacked bar whose trigger is taller than the bar. */
	style?: React.CSSProperties;
}

/** A closed card, a preview that hover or focus opened, or a card that a click pinned. */
type CardState = "closed" | "preview" | "pinned";

/**
 * Wraps a figure so that it opens the figure's {@link SourceCard}
 * (DESIGN.md §8). On a desktop, hover and focus preview the card in a popover
 * 400 px wide below the figure, or above it near the bottom of the page. A
 * click, `Enter` or `Space` pins it, and `Escape` closes it. On a phone, a
 * tap opens the card as a bottom sheet with a close button.
 */
function SourceTrigger({
	claim,
	children,
	className,
	style,
}: SourceTriggerProps) {
	const phone = usePhone();
	const [state, setState] = React.useState<CardState>("closed");
	// A change of layout closes the card, so a card pinned on a desktop does
	// not reopen by itself after a trip through the phone layout.
	const [layoutPhone, setLayoutPhone] = React.useState(phone);
	if (layoutPhone !== phone) {
		setLayoutPhone(phone);
		setState("closed");
	}
	// Escape returns focus to the figure. That focus does not reopen the card.
	const closedByKey = React.useRef(false);
	// While the figure holds focus, the pointer leaving it keeps the preview open.
	const focused = React.useRef(false);
	const triggerClass = cn(
		"cursor-help rounded-sm underline decoration-muted-foreground decoration-dotted underline-offset-4 outline-none print:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/50",
		className,
	);

	if (phone) {
		return (
			<Sheet>
				<SheetTrigger className={triggerClass} style={style}>
					{children}
				</SheetTrigger>
				<SheetContent side="bottom" className="print:hidden">
					<SheetBody className="flex flex-col gap-3">
						<SheetTitle className="font-serif text-xl">
							Sources of {claim.label}
						</SheetTitle>
						<SourceCard claim={claim} />
					</SheetBody>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Popover.Root
			open={state !== "closed"}
			onOpenChange={(open, { reason }) => {
				if (reason === "trigger-press") {
					setState(state === "pinned" ? "closed" : "pinned");
				} else if (open) {
					setState("preview");
				} else if (reason === "trigger-hover") {
					if (state === "preview" && !focused.current) setState("closed");
				} else {
					closedByKey.current = reason === "escape-key";
					setState("closed");
				}
			}}
		>
			<Popover.Trigger
				openOnHover
				delay={200}
				className={triggerClass}
				style={style}
				onFocus={() => {
					focused.current = true;
					if (state === "closed" && !closedByKey.current) setState("preview");
				}}
				onBlur={() => {
					focused.current = false;
					closedByKey.current = false;
					if (state === "preview") setState("closed");
				}}
			>
				{children}
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner side="bottom" sideOffset={8} className="z-50">
					<Popover.Popup
						initialFocus={false}
						aria-label={`Sources of ${claim.label}`}
						className="w-100 max-w-[calc(100vw-2rem)] print:hidden rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none"
					>
						<SourceCard claim={claim} />
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

export {
	SourceCard,
	type SourceCardProps,
	SourceTrigger,
	type SourceTriggerProps,
};
