import type { FundHolding } from "./types";

/**
 * How many funds card 5.1 "Owned By: Largest Funds" lists. DESIGN.md §8 names
 * no count. Ten keeps the table short enough to read on a phone and still
 * shows most of the shares that institutions hold.
 */
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
	const sharesOf = (position: number) => sharesOfRow(funds[position]);
	return funds
		.map((_, position) => position)
		.sort((a, b) => sharesOf(b) - sharesOf(a))
		.slice(0, count);
}

/**
 * Returns the positions in `funds` that card 5.1 lists: the largest
 * {@link LISTED_FUNDS} funds, or none when no fund reports a share count.
 * The card and the sources block of the card both read these rows only.
 */
export function listedFundPositions(funds: readonly FundHolding[]): number[] {
	if (funds.every((row) => sharesOfRow(row) === -Infinity)) {
		return [];
	}
	return largestFundPositions(funds, LISTED_FUNDS);
}

function sharesOfRow(row: FundHolding | undefined): number {
	const value = row?.shares?.value;
	return typeof value === "number" ? value : -Infinity;
}
