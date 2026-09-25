import { growthPerYear } from "@/lib/company/metrics";
import type { Figure } from "@/lib/company/types";
import {
	formatStatementValue,
	lineUnitNote,
	type PeriodView,
	periodLabel,
	type RowTable,
	type Scale,
	type StatementKey,
} from "./financialsTable";

/** The name of each statement in a CSV file name. */
const FILE_STATEMENTS: Record<StatementKey, string> = {
	income: "income",
	balance: "balance",
	cashFlow: "cash-flow",
};

/**
 * Returns the name of the CSV file of a statement table, such as
 * `MRDN-income-annual.csv`.
 */
export function csvFileName(
	ticker: string,
	statement: StatementKey,
	view: PeriodView,
): string {
	return `${ticker}-${FILE_STATEMENTS[statement]}-${view}.csv`;
}

/**
 * Returns the statement table `table` as CSV, with the rows and columns the
 * page shows: a `Line` column, one column per period and, with `growth`, a
 * last `CAGR` column. A line name carries its unit note, as on the page. A
 * figure reads as on the page, with a plain minus and no comma between
 * thousands, so a spreadsheet reads it as a number. A missing figure, and the
 * growth rate of a margin row, is an empty cell.
 */
export function statementCsv(
	table: RowTable,
	scale: Scale,
	growth: boolean,
): string {
	const cell = (figure: Figure) =>
		figure === null ? "" : csvValue(figure, scale);
	const header = [
		"Line",
		...table.periods.map(periodLabel),
		...(growth ? ["CAGR"] : []),
	];
	const rows = table.lines.map((line) => {
		const note = lineUnitNote(line.unit, scale);
		return [
			note === null ? line.label : `${line.label} (${note})`,
			...line.points.map(cell),
			...(growth ? [line.margin ? "" : cell(growthPerYear(line))] : []),
		];
	});
	return [header, ...rows]
		.map((row) => row.map(csvField).join(","))
		.join("\r\n")
		.concat("\r\n");
}

/** Writes a figure as {@link formatStatementValue} does, in a form a spreadsheet reads. */
function csvValue(figure: NonNullable<Figure>, scale: Scale): string {
	const text = formatStatementValue(figure, scale);
	if (typeof figure.value === "string") return text;
	return text.replaceAll(",", "").replace("−", "-");
}

/** Quotes a field that holds a comma, a quote or a line break (RFC 4180). */
function csvField(field: string): string {
	return /[",\r\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field;
}
