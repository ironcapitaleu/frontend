/** Share counts from this one on round to `1.00B` rather than `1000.0M`. */
const BILLIONS_FROM = 999_950_000;

/** Writes a share count in billions or millions, such as `2.13B` or `861.4M`. */
export function formatShares(value: number): string {
	if (Math.abs(value) >= BILLIONS_FROM) return `${(value / 1e9).toFixed(2)}B`;
	if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
	return value.toLocaleString("en-US");
}
