import type { FundHolding } from "../../../lib/company/types";

/** How many funds card 5.1 "Owned By: Largest Funds" lists. */
export const LISTED_FUNDS = 10;

/**
 * Returns the positions in `funds` of the `count` funds that hold the most
 * shares, largest first. A fund with no share count comes last. Two funds
 * with the same count keep the order of `funds`.
 */
export function largestFundPositions(
	funds: readonly FundHolding[],
	count: number,
): number[] {
	const sharesOf = (position: number) => {
		const value = funds[position]?.shares?.value;
		return typeof value === "number" ? value : -Infinity;
	};
	return funds
		.map((_, position) => position)
		.sort((a, b) => sharesOf(b) - sharesOf(a))
		.slice(0, count);
}

/** Writes a share count in billions or millions, such as `2.13B` or `861.4M`. */
export function formatShares(value: number): string {
	if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
	if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
	return value.toLocaleString("en-US");
}
