// Number formatting shared by the screener's table, cards, summary, and
// preview, so one metric reads the same everywhere on the page.

/** The mark for a value the data does not have. */
export const MISSING = "—";

/** A number with a fixed count of decimals, or {@link MISSING} for `null`. */
export function formatNumber(value: number | null, decimals = 1): string {
	return value === null ? MISSING : value.toFixed(decimals);
}

/** A percentage with one decimal, such as `3.1%`, or {@link MISSING}. */
export function formatPercent(value: number | null): string {
	return value === null ? MISSING : `${value.toFixed(1)}%`;
}

/**
 * A change with an explicit sign and a true minus, such as `+1.8%` or `−3.2%`.
 * Zero has no sign. Returns {@link MISSING} for `null`.
 */
export function formatSignedPercent(value: number | null): string {
	if (value === null) return MISSING;
	const rounded = Number(value.toFixed(1));
	const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
	return `${sign}${Math.abs(rounded).toFixed(1)}%`;
}

/** A price in dollars with two decimals, such as `$172.50`. */
export function formatPrice(value: number): string {
	return `$${value.toFixed(2)}`;
}

/** A market capitalization in trillions, billions, or millions of dollars. */
export function formatMarketCap(value: number): string {
	if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
	if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
	if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
	return `$${value.toLocaleString("en-US")}`;
}

/** The tone of a change: a gain, a loss, or neither. */
export type ChangeTone = "positive" | "negative" | "neutral";

/** Which tone a change takes. `null` and zero are neutral. */
export function changeTone(value: number | null): ChangeTone {
	if (value === null || Number(value.toFixed(1)) === 0) return "neutral";
	return value > 0 ? "positive" : "negative";
}

/** The text-color class for each tone, from the semantic tokens. */
export const CHANGE_TONE_CLASS: Record<ChangeTone, string> = {
	positive: "text-positive",
	negative: "text-negative",
	neutral: "text-muted-foreground",
};
