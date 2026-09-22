import { describe, expect, it } from "vitest";

import {
	changeTone,
	formatMarketCap,
	formatNumber,
	formatPercent,
	formatPrice,
	formatSignedPercent,
} from "./format";

describe("formatNumber", () => {
	it("should print the requested decimals when a value is present", () => {
		const expectedResult = "0.91";

		const result = formatNumber(0.912, 2);

		expect(result).toBe(expectedResult);
	});

	it("should print a dash when the value is missing", () => {
		const expectedResult = "—";

		const result = formatNumber(null);

		expect(result).toBe(expectedResult);
	});
});

describe("formatPercent", () => {
	it("should append a percent sign when a value is present", () => {
		const expectedResult = "3.1%";

		const result = formatPercent(3.1);

		expect(result).toBe(expectedResult);
	});

	it("should print a dash when the value is missing", () => {
		const expectedResult = "—";

		const result = formatPercent(null);

		expect(result).toBe(expectedResult);
	});
});

describe("formatSignedPercent", () => {
	it("should print a plus sign when the change is a gain", () => {
		const expectedResult = "+1.8%";

		const result = formatSignedPercent(1.8);

		expect(result).toBe(expectedResult);
	});

	it("should print a true minus when the change is a loss", () => {
		const expectedResult = "−3.2%";

		const result = formatSignedPercent(-3.2);

		expect(result).toBe(expectedResult);
	});

	it("should print no sign when the change rounds to zero", () => {
		const expectedResult = "0.0%";

		const result = formatSignedPercent(-0.04);

		expect(result).toBe(expectedResult);
	});

	it("should print a dash when the change is missing", () => {
		const expectedResult = "—";

		const result = formatSignedPercent(null);

		expect(result).toBe(expectedResult);
	});
});

describe("formatPrice", () => {
	it("should print dollars with two decimals when given a price", () => {
		const expectedResult = "$172.50";

		const result = formatPrice(172.5);

		expect(result).toBe(expectedResult);
	});
});

describe("formatMarketCap", () => {
	it("should pick the unit that fits each size when given caps across scales", () => {
		const expectedResult = ["$2.65T", "$9.3B", "$48.7M", "$950,000"];

		const result = [2.65e12, 9.3e9, 48.7e6, 950_000].map(formatMarketCap);

		expect(result).toEqual(expectedResult);
	});
});

describe("changeTone", () => {
	it("should classify gains, losses, zero, and missing values when given each", () => {
		const expectedResult = ["positive", "negative", "neutral", "neutral"];

		const result = [2, -2, 0.01, null].map(changeTone);

		expect(result).toEqual(expectedResult);
	});
});
