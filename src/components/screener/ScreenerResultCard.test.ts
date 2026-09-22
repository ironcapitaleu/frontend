import { describe, expect, it } from "vitest";

import { cardHighlight } from "./ScreenerResultCard";

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
});
