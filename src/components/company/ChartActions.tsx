import { Button } from "@/components/ui/button";
import type { Claim } from "@/lib/company/types";
import { SourcesChip } from "./SourcesChip";

/** Props for {@link ChartActions}. */
interface ChartActionsProps {
	/** `true` when the card shows its table instead of its chart. */
	data: boolean;
	/** Called with the new value of `data` when the "Data" button is pressed. */
	onData: (data: boolean) => void;
	/** The claims behind the chart, which the "Sources" chip lists. */
	claims: readonly Claim[];
}

/**
 * The "Data" button and the "Sources" chip of a chart card (DESIGN.md §8).
 * The button swaps the chart for a table and back, and its pressed state
 * tells which one shows. Financials card 2.1 and Overview card 1.4 use it.
 */
function ChartActions({ data, onData, claims }: ChartActionsProps) {
	return (
		<>
			<Button
				variant="outline"
				size="sm"
				aria-pressed={data}
				onClick={() => onData(!data)}
			>
				Data
			</Button>
			<SourcesChip claims={claims} />
		</>
	);
}

export { ChartActions, type ChartActionsProps };
