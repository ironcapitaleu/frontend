// The results table's columns and their groups. Kept apart from the
// component so the column data tests on its own.

import type { Stock } from "./screener.logic";

import {
	CHANGE_TONE_CLASS,
	METRICS,
	type MetricField,
	changeTone,
	formatMetric,
	formatPrice,
	formatSignedPercent,
} from "./format";

/** A sortable number column: its header, its group, and how a cell reads. */
export interface NumberColumn {
	readonly field: keyof Stock;
	readonly label: string;
	/**
	 * Names the column group that starts at this column. The column draws a
	 * hairline on its left, and the group runs until the next named column.
	 */
	readonly group?: string;
	/** The column width in px, for the fixed table layout. */
	readonly width: number;
	readonly format: (stock: Stock) => string;
	readonly toneOf?: (stock: Stock) => string;
}

/** A column for a key figure, labelled and formatted from {@link METRICS}. */
function metricColumn(
	field: MetricField,
	width: number,
	group?: string,
): NumberColumn {
	return {
		field,
		width,
		label: METRICS[field].short,
		group,
		format: (stock) => formatMetric(stock[field], field),
	};
}

export const NUMBER_COLUMNS: readonly NumberColumn[] = [
	metricColumn("marketCap", 68, "Valuation"),
	metricColumn("peRatio", 48),
	metricColumn("priceToFcf", 56),
	metricColumn("priceToCash", 60),
	metricColumn("quickRatio", 52, "Balance sheet"),
	metricColumn("currentRatio", 62),
	metricColumn("dividendYield", 68, "Shareholder yield"),
	metricColumn("buybackYield", 68),
	{
		field: "price",
		width: 70,
		label: "Price",
		group: "Price",
		format: (stock) => formatPrice(stock.price),
	},
	{
		field: "changePercent1M",
		width: 58,
		label: "1M",
		format: (stock) => formatSignedPercent(stock.changePercent1M),
		toneOf: (stock) => CHANGE_TONE_CLASS[changeTone(stock.changePercent1M)],
	},
];

/** The columns before the number columns: the company. */
export const LEADING_COLUMNS = 1;

/** The columns after the number columns: the 52-week range. */
export const TRAILING_COLUMNS = 1;

/** Every column in the table. */
export const COLUMN_COUNT =
	LEADING_COLUMNS + NUMBER_COLUMNS.length + TRAILING_COLUMNS;

/** One cell of the group header row: a label and how many columns it spans. */
export interface ColumnGroup {
	readonly label: string;
	readonly span: number;
}

/**
 * The group header row: a label and how many columns it spans. It derives from
 * the `group` names, so it always spans every column. The first group covers
 * the leading columns, and the last also covers the trailing ones. The first
 * number column must name a group, or it folds into the unlabelled leading
 * group.
 */
export function columnGroups(
	columns: readonly NumberColumn[],
): readonly ColumnGroup[] {
	const groups: { label: string; span: number }[] = [
		{ label: "", span: LEADING_COLUMNS },
	];
	for (const column of columns) {
		if (column.group) groups.push({ label: column.group, span: 1 });
		else groups[groups.length - 1].span += 1;
	}
	groups[groups.length - 1].span += TRAILING_COLUMNS;
	return groups;
}

/** The table's group header row. */
export const COLUMN_GROUPS = columnGroups(NUMBER_COLUMNS);
