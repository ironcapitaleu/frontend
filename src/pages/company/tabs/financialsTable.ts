import { toFixedWithMinus } from "@/components/screener/format";
import {
	evaluateMetric,
	isMetricKey,
	MARGINS,
	marginOf,
	metrics,
} from "@/lib/company/metrics";
import type { BarKey } from "@/lib/company/sources";
import type {
	Claim,
	CompletedSections,
	Figure,
	FinancialsSection,
	MetricKey,
	Nullable,
	Period,
	Series,
	StatementTable,
	Unit,
} from "@/lib/company/types";

/** One of the three statements of the statement switch. */
export type StatementKey = keyof FinancialsSection;

/** One of the two positions of the annual and quarterly switch. */
export type PeriodView = "annual" | "quarterly";

/** One of the units that the unit switch offers for dollar and share figures. */
export type Scale = "billions" | "millions";

/** The statements of the switch, in the order DESIGN.md §8 gives them. */
export const STATEMENTS: readonly { key: StatementKey; label: string }[] = [
	{ key: "income", label: "Income statement" },
	{ key: "balance", label: "Balance sheet" },
	{ key: "cashFlow", label: "Cash flow" },
];

/**
 * One row of a statement table or a chart: a statement line, or a metric such
 * as free cash flow.
 */
export interface TableRow extends Series {
	readonly level: number;
	/** `true` for a margin row, which reads as a percent and has no growth rate. */
	readonly margin?: boolean;
}

/** The rows of a statement table or a chart over a run of periods. */
export interface RowTable {
	readonly periods: readonly Period[];
	readonly lines: readonly TableRow[];
}

/** The divisor of each unit. */
export const SCALES: Record<Scale, number> = {
	billions: 1e9,
	millions: 1e6,
};

/** Writes a statement name in title case, such as `Income Statement`. */
export function toTitle(label: string): string {
	return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Returns the column header of `period`, such as `FY2026` or `Q2 FY2027`. */
export function periodLabel(period: Period): string {
	const year = `FY${period.fiscalYear}`;
	return period.fiscalQuarter === null
		? year
		: `Q${period.fiscalQuarter} ${year}`;
}

/**
 * Returns the muted caption of the table: the periods, the unit and the
 * filings, such as `FY2017–FY2026 · USD billions · 10-K`. When a line reads
 * in another unit, such as shares, the unit reads `USD billions unless noted`
 * and that line carries its own note (see {@link lineUnitNote}).
 */
export function tableCaption(
	table: RowTable,
	view: PeriodView,
	scale: Scale,
): string {
	const first = table.periods.at(0);
	const last = table.periods.at(-1);
	const periods =
		first && last ? `${periodLabel(first)}–${periodLabel(last)}` : "No periods";
	const filings = view === "annual" ? "10-K" : "10-Q and 10-K";
	return `${periods} · ${tableUnit(table, scale)} · ${filings}`;
}

/**
 * Returns the unit of the table at `scale`, such as `USD billions`, or
 * `USD billions unless noted` when a line carries its own unit note.
 */
export function tableUnit(table: RowTable, scale: Scale): string {
	const noted = table.lines.some(({ unit }) => lineUnitNote(unit, scale));
	return noted ? `USD ${scale} unless noted` : `USD ${scale}`;
}

/**
 * Returns the unit note of a line whose figures do not read in the caption's
 * USD unit, such as `billions of shares` or `USD per share`, or `null` when
 * the caption's unit fits the line.
 */
export function lineUnitNote(unit: Unit, scale: Scale): string | null {
	if (unit === "shares") return `${scale} of shares`;
	if (unit === "usdPerShare") return "USD per share";
	return null;
}

/**
 * Returns `table` with a muted margin row under each line of {@link MARGINS},
 * one level deeper than that line. A table without a revenue line gets no
 * margin row (DESIGN.md §8 "Financials").
 */
export function withMargins(table: StatementTable): RowTable {
	const revenue = table.lines.find(({ key }) => key === "revenue");
	return {
		periods: table.periods,
		lines: table.lines.flatMap((line): TableRow[] => {
			const margin = MARGINS.find(({ key }) => key === line.key);
			if (revenue === undefined || margin === undefined) return [line];
			const row = marginOf(line, revenue, margin.name);
			return [line, { ...row, level: line.level + 1, margin: true }];
		}),
	};
}

/**
 * Returns `table` with its periods in the reverse order, and the points of
 * each line with them, so the columns stay aligned. The phone shows the
 * newest year first (DESIGN.md §8 "Financials").
 */
export function newestFirst(table: RowTable): RowTable {
	return {
		periods: [...table.periods].reverse(),
		lines: table.lines.map((line) => ({
			...line,
			periods: [...line.periods].reverse(),
			points: [...line.points].reverse(),
		})),
	};
}

/**
 * Writes the value of `claim` as a statement cell. A dollar or share figure
 * reads in `scale` with one decimal and a comma between thousands. A per-share
 * figure keeps its cents. A percent, stored as a fraction, reads with one
 * decimal and a `%`. A text value stays as it is.
 */
export function formatStatementValue(claim: Claim, scale: Scale): string {
	const { value, unit } = claim;
	if (typeof value === "string") return value;
	if (unit === "usd" || unit === "shares") {
		return toFixedWithMinus(value / SCALES[scale], 1, true);
	}
	if (unit === "percent") return `${toFixedWithMinus(value * 100, 1, true)}%`;
	return toFixedWithMinus(value, 2, true);
}

/**
 * Returns the rows `keys` of `table`, in the order of `keys`, over all its
 * periods. A metric key gives the metric's claim for each period, from
 * `evaluateMetric` over `sections`, and a dimmed dash where it has none. The
 * chart card draws these rows, and its "Data" table shows them.
 */
export function chartTable(
	table: StatementTable,
	keys: readonly BarKey[],
	sections: CompletedSections,
): RowTable {
	return {
		periods: table.periods,
		lines: keys.flatMap((key): TableRow[] =>
			isMetricKey(key)
				? [metricRow(key, table.periods, sections)]
				: table.lines.filter((line) => line.key === key),
		),
	};
}

/** The bars of a `BarChart`. A column has a full `label` and a `short` axis label. */
export interface BarTable {
	readonly columns: readonly { key: string; label: string; short: string }[];
	readonly lines: readonly {
		key: string;
		label: string;
		points: readonly Figure[];
	}[];
}

/** Returns the row of metric `key` over `periods`. */
function metricRow(
	key: MetricKey,
	periods: readonly Period[],
	sections: CompletedSections,
): TableRow {
	const { name, unit } = metrics[key];
	const points = periods.map((period) => {
		const result = evaluateMetric(key, sections, period);
		return result.kind === "value" ? result.claim : null;
	});
	return { key, label: name, unit, level: 0, periods, points };
}

/**
 * The least height of a known non-zero bar, in percent of the plot. It keeps
 * a small value visible, so it never reads as a missing year. `MiniBarChart`
 * holds the same floor for the same reason.
 */
export const MIN_BAR_HEIGHT = 2;

/** Where a bar sits, in percent of the plot height from the top. */
export interface BarBox {
	readonly top: number;
	readonly height: number;
}

/**
 * Returns the zero line of the chart of `table`, in percent of the plot
 * height from the top, and a function that places a bar. One scale spans the
 * lowest and the highest value of every line and always holds zero, so a
 * negative value draws below the zero line. A known non-zero bar is at least
 * {@link MIN_BAR_HEIGHT} tall, within the room on its side of the zero line.
 * A text value is not on the scale.
 */
export function barScale(table: BarTable | RowTable): {
	zero: number;
	place: (value: number) => BarBox;
} {
	const values = table.lines.flatMap(({ points }) =>
		points.flatMap((point) =>
			typeof point?.value === "number" && Number.isFinite(point.value)
				? [point.value]
				: [],
		),
	);
	const high = Math.max(0, ...values);
	const span = high - Math.min(0, ...values);
	const zero = span === 0 ? 100 : (high / span) * 100;
	return {
		zero,
		place: (value) => {
			const room = value > 0 ? zero : 100 - zero;
			const height =
				span === 0 || value === 0
					? 0
					: Math.min(
							Math.max((Math.abs(value) / span) * 100, MIN_BAR_HEIGHT),
							room,
						);
			return { top: value > 0 ? zero - height : zero, height };
		},
	};
}

/** The height in px of the mark a reported zero draws in a stacked chart. */
export const ZERO_MARK = 2;

/** Where a part of a stacked chart sits, in px up from the foot of the plot. */
export interface StackBox {
	readonly bottom: number;
	readonly height: number;
	/** Where the trigger of the part sits, in px up from the foot. */
	readonly trigger: { readonly bottom: number; readonly height: number };
}

/**
 * Returns where each part of a stacked chart `plot` px tall sits, as
 * `boxes[line][column]`, and the zero line, `zero` px up from the foot. A
 * part that is not a finite number is `null` and draws nothing. Parts of 0 or
 * more stack up from the zero line, first line lowest, and negative parts
 * stack down from it, first line highest. The zero line sits as far up as
 * the deepest negative column reaches, so it is at the foot when no part is
 * negative. The height of a part is its size times one unit for the whole
 * chart, so parts keep their proportions. A reported zero takes a
 * {@link ZERO_MARK} px mark above the zero line, and the unit leaves room for
 * those marks, so no column overflows the plot.
 *
 * A part keeps its drawn height, but its trigger is at least `least` px
 * tall. Each trigger starts at the foot of its part and grows up. When it
 * meets the trigger below, it moves up, and at the top of the plot it moves
 * down, so it stays inside the plot and never grows below the foot. A higher
 * part's trigger lies above a lower one's. Triggers start at least `least` px
 * apart, so each keeps a strip of `least` px that no other trigger covers.
 * When a column has too many parts for that, the triggers start
 * `(plot - least) / (parts - 1)` px apart instead. They then overlap, but
 * each part still keeps a strip of its own that a pointer can reach.
 */
export function stackScale(
	table: BarTable,
	plot: number,
	least: number,
): { zero: number; boxes: Nullable<StackBox>[][] } {
	const values = table.lines.map(({ points }) =>
		table.columns.map((_, column) => {
			const value = points[column]?.value;
			return typeof value === "number" && Number.isFinite(value) ? value : null;
		}),
	);
	const columns = table.columns.map((_, column) =>
		values.map((row) => row[column] ?? null),
	);
	const sumOf = (parts: readonly Nullable<number>[], sign: 1 | -1) =>
		parts.reduce<number>(
			(sum, value) => sum + Math.max(0, sign * (value ?? 0)),
			0,
		);
	// The deepest negative column sets the room below the zero line.
	const depth = Math.max(0, ...columns.map((parts) => sumOf(parts, -1)));
	// One scale for the chart: the column that fills the plot soonest sets it.
	const scales = columns.flatMap((parts) => {
		const total = depth + sumOf(parts, 1);
		const marks = parts.filter((value) => value === 0).length * ZERO_MARK;
		return total > 0 ? [{ room: Math.max(0, plot - marks), total }] : [];
	});
	const { room, total } = scales.reduce(
		(tightest, scale) =>
			scale.room / scale.total < tightest.room / tightest.total
				? scale
				: tightest,
		scales[0] ?? { room: 0, total: 1 },
	);
	const heightOf = (value: number) => (Math.abs(value) * room) / total;
	const zero = heightOf(depth);
	const boxes = columns.map((parts) =>
		stackColumn(parts, heightOf, zero, plot, least),
	);
	return {
		zero,
		boxes: values.map((row, line) =>
			row.map((_, column) => boxes[column]?.[line] ?? null),
		),
	};
}

/** Returns the boxes of one column of {@link stackScale}, one for each part in `parts`. */
function stackColumn(
	parts: readonly Nullable<number>[],
	heightOf: (value: number) => number,
	zero: number,
	plot: number,
	least: number,
): Nullable<StackBox>[] {
	let top = zero;
	let foot = zero;
	const drawn = parts.map((value) => {
		if (value === null) return null;
		if (value < 0) {
			foot -= heightOf(value);
			return { bottom: foot, height: heightOf(value) };
		}
		const bottom = top;
		const height = value === 0 ? ZERO_MARK : heightOf(value);
		top += height;
		return { bottom, height };
	});
	// Triggers stack in the order of the parts on the plot, lowest first.
	const known = drawn
		.filter((box) => box !== null)
		.sort((a, b) => a.bottom - b.bottom);
	const step =
		known.length > 1 ? Math.min(least, (plot - least) / (known.length - 1)) : 0;
	const lows = known.map(({ bottom }) => bottom);
	for (let index = 1; index < lows.length; index++) {
		lows[index] = Math.max(lows[index] ?? 0, (lows[index - 1] ?? 0) + step);
	}
	for (let index = lows.length - 1; index >= 0; index--) {
		const ceiling =
			index === lows.length - 1 ? plot - least : (lows[index + 1] ?? 0) - step;
		lows[index] = Math.max(0, Math.min(lows[index] ?? 0, ceiling));
	}
	return drawn.map((box) => {
		if (box === null) return null;
		const low = lows[known.indexOf(box)] ?? 0;
		const height = Math.max(box.bottom + box.height - low, least);
		return { ...box, trigger: { bottom: low, height } };
	});
}
