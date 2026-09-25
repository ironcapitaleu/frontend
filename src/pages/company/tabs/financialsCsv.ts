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
	tableUnit,
} from "./financialsTable";

/** The indent of a line name per level, as the page indents its row. */
const INDENT = "  ";

/**
 * The first characters that make a spreadsheet read a field as a formula,
 * even inside quotes (OWASP "CSV Injection").
 */
const FORMULA_START = /^[=+\-@\t\r]/;

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
 * last `CAGR` column. The `Line` header names the unit of the page caption,
 * such as `Line (USD billions)`, so a file keeps the unit it was saved in.
 * A line name is indented two spaces per level, as the page indents it, so
 * a part stays apart from the total above it. A line name carries its unit note, as on the page. A
 * figure reads as on the page, with a plain minus and no comma between
 * thousands, so a spreadsheet reads it as a number. A missing figure, and the
 * growth rate of a margin row, is an empty cell. A line name or a text figure
 * that starts like a formula gets a leading `'`, so a spreadsheet shows it as
 * text and never runs it.
 */
export function statementCsv(
	table: RowTable,
	scale: Scale,
	growth: boolean,
): string {
	const cell = (figure: Figure) =>
		figure === null ? "" : csvValue(figure, scale);
	const header = [
		`Line (${tableUnit(table, scale)})`,
		...table.periods.map(periodLabel),
		...(growth ? ["CAGR"] : []),
	];
	const rows = table.lines.map((line) => {
		const note = lineUnitNote(line.unit, scale);
		const name = note === null ? line.label : `${line.label} (${note})`;
		return [
			`${INDENT.repeat(line.level)}${asText(name)}`,
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
	if (typeof figure.value === "string") return asText(text);
	return text.replaceAll(",", "").replaceAll("−", "-");
}

/** Returns free text with a leading `'` when it starts like a formula. */
function asText(text: string): string {
	return FORMULA_START.test(text) ? `'${text}` : text;
}

/** Quotes a field that holds a comma, a quote or a line break (RFC 4180). */
function csvField(field: string): string {
	return /[",\r\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field;
}
