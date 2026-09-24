import { toFixedWithMinus } from "@/components/screener/format";
import type {
	Claim,
	FinancialsSection,
	LineKey,
	Period,
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
	table: StatementTable,
	view: PeriodView,
	scale: Scale,
): string {
	const first = table.periods.at(0);
	const last = table.periods.at(-1);
	const periods =
		first && last ? `${periodLabel(first)}–${periodLabel(last)}` : "No periods";
	const filings = view === "annual" ? "10-K" : "10-Q and 10-K";
	const noted = table.lines.some(({ unit }) => lineUnitNote(unit, scale));
	const unit = noted ? `USD ${scale} unless noted` : `USD ${scale}`;
	return `${periods} · ${unit} · ${filings}`;
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
 * Returns `table` with its periods in the reverse order, and the points of
 * each line with them, so the columns stay aligned. The phone shows the
 * newest year first (DESIGN.md §8 "Financials").
 */
export function newestFirst(table: StatementTable): StatementTable {
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
 * Returns the lines `keys` of `table`, in the order of `keys`, over all its
 * periods. The chart card draws these lines, and its "Data" table shows them.
 */
export function chartTable(
	table: StatementTable,
	keys: readonly LineKey[],
): StatementTable {
	return {
		periods: table.periods,
		lines: keys.flatMap((key) =>
			table.lines.filter((line) => line.key === key),
		),
	};
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
export function barScale(table: StatementTable): {
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
