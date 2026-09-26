import { formatInUnit } from "@/components/company/format";
import { SourceTrigger } from "@/components/company/SourceCard";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Figure } from "../../../lib/company/types";

/** Props for {@link FigureText} and {@link FigureCell}. */
interface FigureProps {
	figure: Figure;
	/** Writes the value. By default, it writes the value in the figure's unit. */
	format?: (value: number) => string;
}

/**
 * A figure that opens its sources, or the dimmed dash when it is missing or
 * its value is not a finite number.
 */
export function FigureText({ figure, format }: FigureProps) {
	const value = figure?.value;
	return figure !== null &&
		typeof value === "number" &&
		Number.isFinite(value) ? (
		<SourceTrigger claim={figure}>
			{format ? format(value) : formatInUnit(value, figure.unit)}
		</SourceTrigger>
	) : (
		<span className={MISSING_INK}>{MISSING}</span>
	);
}

/** A right-aligned mono {@link FigureText} in a table cell. */
export function FigureCell({
	className,
	...props
}: FigureProps & { className?: string }) {
	return (
		<TableCell className={cn("text-right font-monospace", className)}>
			<FigureText {...props} />
		</TableCell>
	);
}

/** A text claim that opens its sources, or the dimmed dash when it is missing or not text. */
export function ClaimText({ claim }: { claim: Figure }) {
	return claim !== null && typeof claim.value === "string" ? (
		<SourceTrigger claim={claim}>{claim.value}</SourceTrigger>
	) : (
		<span className={MISSING_INK}>{MISSING}</span>
	);
}

/** A {@link ClaimText} in a table cell. */
export function ClaimCell({ claim }: { claim: Figure }) {
	return (
		<TableCell>
			<ClaimText claim={claim} />
		</TableCell>
	);
}
