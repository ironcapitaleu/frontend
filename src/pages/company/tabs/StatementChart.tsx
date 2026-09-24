import { SourceTrigger } from "@/components/company/SourceCard";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import type { StatementTable } from "@/lib/company/types";
import { cn } from "@/lib/utils";
import {
	barScale,
	formatStatementValue,
	periodLabel,
	type Scale,
} from "./financialsTable";

/** The fill of each line, in chart order. Far apart on the ramp, so they tell apart. */
const INKS = ["bg-chart-1", "bg-chart-3", "bg-chart-5"];

/**
 * The bar chart of Financials card 2.1 (DESIGN.md §8 "Financials"): one group
 * of bars per fiscal year and one bar per line of `table`, oldest year first.
 * Every bar is a figure: hover or focus previews its sources, and a click or
 * a tap pins them. A missing point draws a dimmed dash on the zero line. A
 * legend names the lines. The year labels are short, such as `FY26`, so ten
 * of them fit at 390 px. Each group names its full year to a screen reader.
 */
export function StatementChart({
	table,
	scale,
}: {
	table: StatementTable;
	scale: Scale;
}) {
	const { zero, place } = barScale(table);
	return (
		<div className="flex flex-col gap-3">
			<ul
				aria-label="Legend"
				className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
			>
				{table.lines.map((line, index) => (
					<li key={line.key} className="flex items-center gap-1.5">
						<span
							aria-hidden="true"
							className={cn("size-3 rounded-[2px]", INKS[index])}
						/>
						{line.label}
					</li>
				))}
			</ul>
			<ul
				aria-label="Fiscal years"
				className="relative flex h-56 gap-1 md:gap-3"
			>
				{table.periods.map((period, column) => (
					<li key={period.endsOn} className="flex flex-1 justify-center gap-px">
						<span className="sr-only">{periodLabel(period)}</span>
						{table.lines.map((line, index) => {
							const point = line.points[column] ?? null;
							if (
								point === null ||
								typeof point.value !== "number" ||
								!Number.isFinite(point.value)
							) {
								return (
									<span
										key={line.key}
										className={cn(
											"relative flex-1 max-w-5 text-center text-xs",
											MISSING_INK,
										)}
										style={{ top: `calc(${zero}% - 0.5rem)` }}
									>
										{MISSING}
									</span>
								);
							}
							const { top, height } = place(point.value);
							return (
								<div key={line.key} className="relative h-full max-w-5 flex-1">
									<div
										className="absolute inset-x-0 min-h-px"
										style={{ top: `${top}%`, height: `${height}%` }}
									>
										<SourceTrigger
											claim={point}
											className={cn(
												"block size-full rounded-none",
												INKS[index],
												point.value > 0 ? "rounded-t-[2px]" : "rounded-b-[2px]",
											)}
										>
											<span className="sr-only">
												{`${line.label}: ${formatStatementValue(point, scale)}`}
											</span>
										</SourceTrigger>
									</div>
								</div>
							);
						})}
					</li>
				))}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 h-px bg-muted-foreground/50"
					style={{ top: `${zero}%` }}
				/>
			</ul>
			<div
				aria-hidden="true"
				className="flex gap-1 font-monospace text-xs text-muted-foreground md:gap-3"
			>
				{table.periods.map((period) => (
					<span key={period.endsOn} className="flex-1 text-center">
						{`FY${String(period.fiscalYear).slice(-2)}`}
					</span>
				))}
			</div>
		</div>
	);
}
