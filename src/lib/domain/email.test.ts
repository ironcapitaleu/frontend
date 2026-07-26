import { describe, expect, it } from "vitest";

import { Email, type InvalidEmailReason, InvalidEmail } from "./email";

/** Captures the rejection reason of a parse attempt, or "accepted" if it succeeds. */
function reasonOf(raw: string): InvalidEmailReason | "accepted" {
	try {
		Email.parse(raw);
		return "accepted";
	} catch (error) {
		return (error as InvalidEmail).reason;
	}
}

describe("Email", () => {
	it("should expose the normalised value when the input is valid", () => {
		const expectedResult = "investor@ironcapital.test";

		const result = Email.parse("  Investor@IronCapital.test  ").value;

		expect(result).toBe(expectedResult);
	});

	it("should expose the local part when constructed", () => {
		const expectedResult = "investor";

		const result = Email.parse("investor@ironcapital.test").localPart;

		expect(result).toBe(expectedResult);
	});

	it("should expose the domain when constructed", () => {
		const expectedResult = "ironcapital.test";

		const result = Email.parse("investor@ironcapital.test").domain;

		expect(result).toBe(expectedResult);
	});

	it("should treat two emails with the same address as equal", () => {
		const expectedResult = true;

		const result = Email.parse("investor@ironcapital.test").equals(
			Email.parse("INVESTOR@ironcapital.test"),
		);

		expect(result).toBe(expectedResult);
	});

	it("should treat two emails with different addresses as unequal", () => {
		const expectedResult = false;

		const result = Email.parse("investor@ironcapital.test").equals(
			Email.parse("analyst@ironcapital.test"),
		);

		expect(result).toBe(expectedResult);
	});

	it("should serialise to the plain string when JSON-stringified", () => {
		const expectedResult = '"investor@ironcapital.test"';

		const result = JSON.stringify(Email.parse("investor@ironcapital.test"));

		expect(result).toBe(expectedResult);
	});

	it("should render as the plain string in a template literal", () => {
		const expectedResult = "investor@ironcapital.test";

		const result = `${Email.parse("investor@ironcapital.test")}`;

		expect(result).toBe(expectedResult);
	});

	it("should format InvalidEmail in the bracketed display format", () => {
		const expectedResult =
			"[InvalidEmail] Not a valid email address, Reason: 'missing-at', Input: 'not-an-email'";

		const result = new InvalidEmail("missing-at", "not-an-email").message;

		expect(result).toBe(expectedResult);
	});
});

// Table-driven pass/fail cases. Add a row here to check a new address; each row
// runs as its own single-assertion test.
describe("Email validity", () => {
	const cases: ReadonlyArray<{ input: string; valid: boolean }> = [
		// Accepted
		{ input: "investor@ironcapital.test", valid: true },
		{ input: "  Investor@IronCapital.test  ", valid: true },
		{ input: "first.last+tag@sub.domain.co.uk", valid: true },
		{ input: "a@b.co", valid: true },
		// Rejected
		{ input: "   ", valid: false },
		{ input: "investor.ironcapital.test", valid: false },
		{ input: "investor@ironcapital", valid: false },
		{ input: "@ironcapital.test", valid: false },
		{ input: "investor@corp@ironcapital.test", valid: false },
		{ input: "in vestor@ironcapital.test", valid: false },
		{ input: "investor@ironcapital.test.", valid: false },
	];

	it.each(cases)(
		"should report isValid=$valid when the input is '$input'",
		({ input, valid }) => {
			const expectedResult = valid;

			const result = Email.isValid(input);

			expect(result).toBe(expectedResult);
		},
	);
});

// Table-driven rejection reasons: which invariant each malformed address trips.
describe("Email rejection reasons", () => {
	const cases: ReadonlyArray<{ input: string; reason: InvalidEmailReason }> = [
		{ input: "   ", reason: "empty" },
		{ input: "in vestor@ironcapital.test", reason: "contains-whitespace" },
		{ input: "investor.ironcapital.test", reason: "missing-at" },
		{ input: "investor@corp@ironcapital.test", reason: "multiple-at" },
		{ input: "@ironcapital.test", reason: "empty-local-part" },
		{ input: "investor@ironcapital", reason: "invalid-domain" },
	];

	it.each(cases)(
		"should reject '$input' with reason $reason",
		({ input, reason }) => {
			const expectedResult = reason;

			const result = reasonOf(input);

			expect(result).toBe(expectedResult);
		},
	);
});
