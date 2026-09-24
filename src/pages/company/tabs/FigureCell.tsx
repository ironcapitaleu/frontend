import { SourceTrigger } from "@/components/company/SourceCard";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import { TableCell } from "@/components/ui/table";
import type { Figure } from "../../../lib/company/types";

/** A right-aligned mono figure that opens its sources, or the dimmed dash when it is missing. */
export function FigureCell({
	figure,
	format,
}: {
	figure: Figure;
	format: (value: number) => string;
}) {
	return (
		<TableCell className="text-right font-monospace">
			{figure !== null && typeof figure.value === "number" ? (
				<SourceTrigger claim={figure}>{format(figure.value)}</SourceTrigger>
			) : (
				<span className={MISSING_INK}>{MISSING}</span>
			)}
		</TableCell>
	);
}
