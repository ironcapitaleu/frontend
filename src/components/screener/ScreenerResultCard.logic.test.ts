import { describe, expect, it } from "vitest";

import { cardFigures, cardHighlight } from "./ScreenerResultCard.logic";

describe("cardHighlight", () => {
	it("should keep the requested figure when it is not already on the card", () => {
		const expectedResult = "buybackYield";

		const result = cardHighlight("buybackYield");

		expect(result).toBe(expectedResult);
	});

	it("should fall back to the dividend when the figure is already on the card", () => {
		const expectedResult = ["dividendYield", "dividendYield"];

		const result = [cardHighlight("peRatio"), cardHighlight("priceToFcf")];

		expect(result).toEqual(expectedResult);
	});

	it("should fall back to the dividend when the sort field is not a key figure", () => {
		const expectedResult = ["dividendYield", "dividendYield"];

		const result = [cardHighlight("changePercent1M"), cardHighlight(null)];

		expect(result).toEqual(expectedResult);
	});
});

describe("cardFigures", () => {
	it("should highlight P/E when the list is sorted by P/E", () => {
		const expectedResult = [
			{ field: "peRatio", highlighted: true },
			{ field: "priceToFcf", highlighted: false },
			{ field: "dividendYield", highlighted: false },
		];

		const result = cardFigures("peRatio");

		expect(result).toEqual(expectedResult);
	});

	it("should highlight no figure when the list has no sort", () => {
		const expectedResult = [false, false, false];

		const result = cardFigures(null).map((figure) => figure.highlighted);

		expect(result).toEqual(expectedResult);
	});
});
