import { SourceTrigger } from "@/components/company/SourceCard";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import { cn } from "@/lib/utils";
import {
	barScale,
	formatStatementValue,
	periodLabel,
	type RowTable,
	type Scale,
} from "./financialsTable";

/**
 * The fill of each line, in chart order. Far apart on the ramp, so they tell
 * apart. A line past the last fill starts the list again.
 */
const INKS = ["bg-chart-1", "bg-chart-3", "bg-chart-5"];

/** The height of the plot in px. It matches the `h-56` class of the plot. */
const PLOT_HEIGHT = 224;

/** The least tap target of a bar in px, the `min-h-6` of its trigger. */
const MIN_TARGET = 24;

/**
 * The bar chart of Financials card 2.1 (DESIGN.md §8 "Financials"): one group
 * of bars per fiscal year and one bar per line of `table`, oldest year first.
 * Every bar is a figure: hover or focus previews its sources, and a click or
 * a tap pins them. A missing point draws a dimmed dash on the zero line. A
 * legend names the lines. The year labels are short, such as `FY26`, so ten
 * of them fit at 390 px. Each group names its full year to a screen reader.
 * A bar keeps its drawn height, but its trigger is at least 24 px tall, and
 * every bar is 24 px wide, so a small bar can still be tapped. The trigger
 * grows away from the zero line when that side has room, and across it
 * otherwise, so it stays inside the plot. The 24 × 24 px target departs
 * from the 44 × 44 px rule in AGENTS.md "Navigation — Mobile Patterns":
 * three 44 px bars for each of ten years would make every chart scroll on a
 * desktop, so a bar keeps the 24 × 24 px minimum of WCAG 2.5.8 (DESIGN.md §8
 * "Financials"). Below 1024 px,
 * a chart that does not fit its card scrolls sideways (DESIGN.md §8 "Shared
 * Layout"), and the year labels scroll with their groups. A table with no
 * fiscal year or no line draws one line that says so.
 */
export function StatementChart({
	table,
	scale,
}: {
	table: RowTable;
	scale: Scale;
}) {
	const { zero, place } = barScale(table);
	// A group and its year label take the same width, so the two rows line up.
	const groupWidth = `calc(${table.lines.length} * 1.5rem + ${table.lines.length - 1}px)`;
	if (table.periods.length === 0 || table.lines.length === 0) {
		return (
			<p className="text-base text-muted-foreground">
				No fiscal years to chart.
			</p>
		);
	}
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
							className={cn("size-3 rounded-[2px]", inkOf(index))}
						/>
						{line.label}
					</li>
				))}
			</ul>
			<div className="max-lg:overflow-x-auto">
				<div className="flex min-w-max flex-col gap-3">
					<div className="relative">
						<ul aria-label="Fiscal years" className="flex h-56 gap-1 md:gap-3">
							{table.periods.map((period, column) => (
								<li
									key={period.endsOn}
									className="flex flex-1 justify-center gap-px"
									style={{ minWidth: groupWidth }}
								>
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
														"relative w-6 shrink-0 text-center text-xs",
														MISSING_INK,
													)}
													style={{ top: `calc(${zero}% - 0.5rem)` }}
												>
													{MISSING}
												</span>
											);
										}
										const { top, height } = place(point.value);
										const negative = point.value < 0;
										// The trigger grows away from the zero line when that side
										// of the plot has room for it, and across the line otherwise.
										const room =
											((negative ? 100 - zero : zero) / 100) * PLOT_HEIGHT;
										const growsDown = negative === room >= MIN_TARGET;
										// A reported zero draws a 2 px mark above the zero line,
										// so it never reads as a missing year.
										const zeroMark = point.value === 0;
										return (
											<div
												key={line.key}
												className="relative h-full w-6 shrink-0"
											>
												<div
													className={cn(
														"absolute inset-x-0",
														inkOf(index),
														negative ? "rounded-b-[2px]" : "rounded-t-[2px]",
													)}
													style={
														zeroMark
															? { top: `calc(${top}% - 2px)`, height: "2px" }
															: { top: `${top}%`, height: `${height}%` }
													}
												>
													<SourceTrigger
														claim={point}
														className={cn(
															"absolute inset-x-0 block h-full min-h-6 rounded-none",
															growsDown ? "top-0" : "bottom-0",
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
						</ul>
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-x-0 h-px bg-muted-foreground/50"
							style={{ top: `${zero}%` }}
						/>
					</div>
					<div
						aria-hidden="true"
						className="flex gap-1 font-monospace text-xs text-muted-foreground md:gap-3"
					>
						{table.periods.map((period) => (
							<span
								key={period.endsOn}
								className="flex-1 text-center"
								style={{ minWidth: groupWidth }}
							>
								{`FY${String(period.fiscalYear).slice(-2)}`}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/** Returns the fill of the line at `index`. */
function inkOf(index: number): string {
	return INKS[index % INKS.length] ?? "";
}
