import { describe, expect, it } from "vitest";

import { InvalidTicker, type InvalidTickerReason, Ticker } from "./ticker";

/** Captures the rejection reason of a parse attempt, or "accepted" if it succeeds. */
function reasonOf(raw: string): InvalidTickerReason | "accepted" {
	try {
		Ticker.parse(raw);
		return "accepted";
	} catch (error) {
		return (error as InvalidTicker).reason;
	}
}

describe("Ticker", () => {
	it("should normalise the value when the input has spaces and lower case", () => {
		const expectedResult = "MRDN";

		const result = Ticker.parse(" mrdn ").value;

		expect(result).toBe(expectedResult);
	});

	it("should treat two tickers as equal when their normalised values match", () => {
		const expectedResult = true;

		const result = Ticker.parse("MRDN").equals(Ticker.parse(" mrdn "));

		expect(result).toBe(expectedResult);
	});

	it("should treat two tickers as unequal when their normalised values differ", () => {
		const expectedResult = false;

		const result = Ticker.parse("MRDN").equals(Ticker.parse("BRK.B"));

		expect(result).toBe(expectedResult);
	});

	it("should serialise to the plain string when JSON-stringified", () => {
		const expectedResult = '"MRDN"';

		const result = JSON.stringify(Ticker.parse("mrdn"));

		expect(result).toBe(expectedResult);
	});

	it("should render as the plain string when used in a template literal", () => {
		const expectedResult = "MRDN";

		const result = `${Ticker.parse("mrdn")}`;

		expect(result).toBe(expectedResult);
	});

	it("should format InvalidTicker in the bracketed display format when constructed", () => {
		const expectedResult =
			"[InvalidTicker] Not a valid ticker, Reason: 'too-long', Input: 'MERIDIANSEMI'";

		const result = new InvalidTicker("too-long", "MERIDIANSEMI").message;

		expect(result).toBe(expectedResult);
	});

	it("should name the error InvalidTicker when Ticker.parse rejects the input", () => {
		const expectedResult = "InvalidTicker";

		const result = (() => {
			try {
				Ticker.parse("   ");
				return "accepted";
			} catch (error) {
				return (error as InvalidTicker).name;
			}
		})();

		expect(result).toBe(expectedResult);
	});

	it("should keep the raw input when Ticker.parse rejects the input", () => {
		const expectedResult = " mr dn ";

		const result = (() => {
			try {
				Ticker.parse(" mr dn ");
				return "accepted";
			} catch (error) {
				return (error as InvalidTicker).invalidInput;
			}
		})();

		expect(result).toBe(expectedResult);
	});
});

// Table-driven accepted inputs: each row shows the normalised value parse returns.
describe("Ticker accepted inputs", () => {
	const cases: ReadonlyArray<{ input: string; value: string }> = [
		{ input: "MRDN", value: "MRDN" },
		{ input: "BRK.B", value: "BRK.B" },
		{ input: "BF-B", value: "BF-B" },
	];

	it.each(cases)(
		"should accept the ticker when the input is '$input'",
		({ input, value }) => {
			const expectedResult = value;

			const result = Ticker.parse(input).value;

			expect(result).toBe(expectedResult);
		},
	);
});

// Table-driven pass/fail cases. Add a row here to check a new ticker; each row
// runs as its own single-assertion test.
describe("Ticker validity", () => {
	const cases: ReadonlyArray<{ input: string; valid: boolean }> = [
		// Accepted
		{ input: "MRDN", valid: true },
		{ input: " mrdn ", valid: true },
		{ input: "BRK.B", valid: true },
		{ input: "BF-B", valid: true },
		{ input: "ABCDEFGHIJ", valid: true },
		// Rejected
		{ input: "   ", valid: false },
		{ input: "ABCDEFGHIJK", valid: false },
		{ input: "MR DN", valid: false },
		{ input: "MRDN-", valid: false },
	];

	it.each(cases)(
		"should report isValid=$valid when the input is '$input'",
		({ input, valid }) => {
			const expectedResult = valid;

			const result = Ticker.isValid(input);

			expect(result).toBe(expectedResult);
		},
	);
});

// Table-driven rejection reasons: one row per example input of STA-223, each
// showing which rule it breaks first.
describe("Ticker rejection reasons", () => {
	const cases: ReadonlyArray<{ input: string; reason: InvalidTickerReason }> = [
		{ input: "   ", reason: "empty" },
		{ input: "MERIDIANSEMI", reason: "too-long" },
		{ input: "MR DN", reason: "invalid-character" },
		{ input: "MRDN/X", reason: "invalid-character" },
		{ input: ".MRDN", reason: "invalid-separator" },
		{ input: "MRDN-", reason: "invalid-separator" },
		{ input: "BRK..B", reason: "invalid-separator" },
	];

	it.each(cases)(
		"should reject the input with reason $reason when the input is '$input'",
		({ input, reason }) => {
			const expectedResult = reason;

			const result = reasonOf(input);

			expect(result).toBe(expectedResult);
		},
	);
});
