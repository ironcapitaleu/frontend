import type {
	Claim,
	FinancialsSection,
	Period,
	StatementTable,
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

/** Returns the column header of `period`, such as `FY2026` or `Q2 FY2027`. */
export function periodLabel(period: Period): string {
	const year = `FY${period.fiscalYear}`;
	return period.fiscalQuarter === null
		? year
		: `Q${period.fiscalQuarter} ${year}`;
}

/**
 * Returns the muted caption of the table: the periods, the unit and the
 * filings, such as `FY2017–FY2026 · USD billions · 10-K`.
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
	return `${periods} · USD ${scale} · ${filings}`;
}

/**
 * Writes the value of `claim` as a statement cell. A dollar or share figure
 * reads in `scale` with one decimal. A per-share figure keeps its cents. A
 * text value stays as it is.
 */
export function formatStatementValue(claim: Claim, scale: Scale): string {
	const { value, unit } = claim;
	if (typeof value === "string") return value;
	return unit === "usd" || unit === "shares"
		? grouped(value / SCALES[scale], 1)
		: grouped(value, 2);
}

/**
 * Writes `value` with `decimals` places, a comma between thousands and a true
 * minus (U+2212) for a loss, as the screener writes a loss.
 */
function grouped(value: number, decimals: number): string {
	// `|| 0` turns a rounded -0 into 0, so a value that rounds to zero has no sign.
	const rounded = Number(value.toFixed(decimals)) || 0;
	return rounded
		.toLocaleString("en-US", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		})
		.replace("-", "−");
}
