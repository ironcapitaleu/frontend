// Chooses the key figures a result card shows and which one carries the sort
// cue. Kept apart from the component so the choice tests on its own.

import type { Stock } from "./screener.logic";

import { METRICS, type MetricField } from "./format";

/** One key figure on a card, and whether the list is sorted by it. */
export interface CardFigure {
	readonly field: MetricField;
	readonly highlighted: boolean;
}

/**
 * The third key figure for a sort on `field`. A field that is not a key
 * figure, or P/E and P/FCF, which always show, fall back to the dividend.
 */
export function cardHighlight(field: keyof Stock | null): MetricField {
	if (!field || !Object.hasOwn(METRICS, field)) return "dividendYield";
	return field === "peRatio" || field === "priceToFcf"
		? "dividendYield"
		: (field as MetricField);
}

/**
 * The card's three key figures for a sort on `field`: P/E, P/FCF, and the
 * third figure from {@link cardHighlight}. The figure the list is sorted by is
 * highlighted, including P/E or P/FCF. With no sort, none is.
 */
export function cardFigures(field: keyof Stock | null): CardFigure[] {
	return (["peRatio", "priceToFcf", cardHighlight(field)] as const).map(
		(figure) => ({ field: figure, highlighted: figure === field }),
	);
}
