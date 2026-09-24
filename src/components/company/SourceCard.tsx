import { Popover } from "@base-ui/react/popover";
import * as React from "react";

import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import type { Claim, IsoDate } from "@/lib/company/types";
import { cn } from "@/lib/utils";

/** The width below which the page is a phone (DESIGN.md §8 "Shared Layout"). */
const PHONE_QUERY = "(max-width: 767px)";

/** Props for {@link SourceCard}. */
interface SourceCardProps extends React.ComponentProps<"div"> {
	claim: Claim;
}

/**
 * The source card of one figure (DESIGN.md §8). A reported claim names its
 * document, the filing date, the line and the XBRL tag when the document has
 * one, and links to the filing. A derived claim shows its formula and one
 * entry for each input, and each input shows its own source. So a reader can
 * follow any figure down to reported lines.
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

/** The source of `claim`. A derived claim walks its inputs down to reported sources. */
function SourceOf({ claim }: { claim: Claim }) {
	const { source } = claim;
	if (source.kind === "derived") {
		return (
			<div className="flex flex-col gap-2">
				<p data-slot="formula" className="font-monospace">
					{source.formula}
				</p>
				<ul
					aria-label={`Inputs of ${claim.label}`}
					className="flex flex-col gap-3 border-l border-border pl-3"
				>
					{source.inputs.map((input) => (
						<li key={input.id} className="flex flex-col gap-1">
							<span className="font-medium">{input.label}</span>
							<SourceOf claim={input} />
						</li>
					))}
				</ul>
			</div>
		);
	}
	const { document } = source;
	const filing = document.kind === "filing";
	return (
		<div className="flex flex-col gap-2">
			<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
				<dt className="text-muted-foreground">{filing ? "Filing" : "Data"}</dt>
				<dd>
					{filing
						? `${document.form} for ${document.periodLabel}, ${document.filer}`
						: document.name}
				</dd>
				<dt className="text-muted-foreground">{filing ? "Filed" : "As of"}</dt>
				<dd>{formatDate(filing ? document.filedOn : document.asOf)}</dd>
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
				href={filing ? document.indexUrl : document.url}
				target="_blank"
				rel="noreferrer"
				className="text-primary underline underline-offset-4"
			>
				{filing ? "Open the filing on SEC EDGAR" : "Open the data source"}
			</a>
		</div>
	);
}

/** Writes `date` as the page prints it, such as `12 Mar 2026`. */
function formatDate(date: IsoDate): string {
	return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}

/** Props for {@link SourceTrigger}. */
interface SourceTriggerProps {
	claim: Claim;
	/** The figure, as the page draws it. */
	children: React.ReactNode;
	className?: string;
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
function SourceTrigger({ claim, children, className }: SourceTriggerProps) {
	const phone = React.useSyncExternalStore(subscribeToPhone, isPhone);
	const [state, setState] = React.useState<CardState>("closed");
	// Escape returns focus to the figure. That focus does not reopen the card.
	const closedByKey = React.useRef(false);
	const triggerClass = cn(
		"cursor-help rounded-sm underline decoration-muted-foreground decoration-dotted underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
		className,
	);

	if (phone) {
		return (
			<Sheet>
				<SheetTrigger className={triggerClass}>{children}</SheetTrigger>
				<SheetContent side="bottom">
					<SheetBody className="flex flex-col gap-3">
						<SheetTitle className="font-serif text-xl">Sources</SheetTitle>
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
				} else if (state === "preview" || reason !== "trigger-hover") {
					closedByKey.current = reason === "escape-key";
					setState("closed");
				}
			}}
		>
			<Popover.Trigger
				openOnHover
				delay={200}
				className={triggerClass}
				onFocus={() => {
					if (state === "closed" && !closedByKey.current) setState("preview");
				}}
				onBlur={() => {
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
						className="w-100 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none"
					>
						<SourceCard claim={claim} />
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

function isPhone(): boolean {
	return window.matchMedia(PHONE_QUERY).matches;
}

function subscribeToPhone(onChange: () => void): () => void {
	const query = window.matchMedia(PHONE_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

export {
	SourceCard,
	type SourceCardProps,
	SourceTrigger,
	type SourceTriggerProps,
};
