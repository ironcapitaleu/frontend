// Builds the summary strip's cells from the result set and the universe. Kept
// pure so the medians test apart from the render.

import { type Stock, median } from "./screener.logic";

import {
	type ChangeTone,
	changeTone,
	formatNumber,
	formatPercent,
	formatSignedPercent,
} from "./format";

/** One cell of the summary strip. */
export interface SummaryCell {
	readonly label: string;
	/** The median of the result set, formatted. */
	readonly value: string;
	/** The median of the whole universe, formatted, for comparison. */
	readonly universe: string;
	readonly tone: ChangeTone;
}

/**
 * The four summary cells for a result set, compared with the universe.
 * `matched` is expected to be a subset of `universe`.
 */
export function buildSummaryCells(
	matched: readonly Stock[],
	universe: readonly Stock[],
): SummaryCell[] {
	const medianOf = (
		stocks: readonly Stock[],
		pick: (stock: Stock) => number | null,
	) => median(stocks.map(pick));
	const change = medianOf(matched, (stock) => stock.changePercent1M);

	return [
		{
			label: "Median P/E",
			value: formatNumber(medianOf(matched, (stock) => stock.peRatio)),
			universe: formatNumber(medianOf(universe, (stock) => stock.peRatio)),
			tone: "neutral",
		},
		{
			label: "Median P/FCF",
			value: formatNumber(medianOf(matched, (stock) => stock.priceToFcf)),
			universe: formatNumber(medianOf(universe, (stock) => stock.priceToFcf)),
			tone: "neutral",
		},
		{
			label: "Median dividend",
			value: formatPercent(medianOf(matched, (stock) => stock.dividendYield)),
			universe: formatPercent(
				medianOf(universe, (stock) => stock.dividendYield),
			),
			tone: "neutral",
		},
		{
			label: "Median 1M",
			value: formatSignedPercent(change),
			universe: formatSignedPercent(
				medianOf(universe, (stock) => stock.changePercent1M),
			),
			tone: changeTone(change),
		},
	];
}
