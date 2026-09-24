import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { InsiderHolding } from "../../../lib/company/types";
import { FigureCell } from "./FigureCell";
import { formatShares } from "./relationships";

/**
 * The shares that each officer and director holds, from their latest Form 4.
 * Relationships card 5.2 and Management card 6.4 both draw it. With no row it
 * says so in one line.
 */
export function InsiderTable({
	insiders,
}: {
	insiders: readonly InsiderHolding[];
}) {
	if (insiders.length === 0) {
		return (
			<p className="text-muted-foreground">No insider reports a holding.</p>
		);
	}
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="sticky left-0 bg-card">Insider</TableHead>
					<TableHead>Role</TableHead>
					<TableHead className="text-right">Shares</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{insiders.map((row, position) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: the section fixes the order of the rows, and two insiders can share a name and role
					<TableRow key={position}>
						<TableHead scope="row" className="sticky left-0 bg-card">
							{row.name}
						</TableHead>
						<TableCell>{row.role}</TableCell>
						<FigureCell figure={row.shares} format={formatShares} />
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
