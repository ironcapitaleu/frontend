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

	it("should report validity without throwing when the input is valid", () => {
		const expectedResult = true;

		const result = Email.isValid("investor@ironcapital.test");

		expect(result).toBe(expectedResult);
	});

	it("should report invalidity without throwing when the input is malformed", () => {
		const expectedResult = false;

		const result = Email.isValid("not-an-email");

		expect(result).toBe(expectedResult);
	});

	it("should render as the plain string in a template literal", () => {
		const expectedResult = "investor@ironcapital.test";

		const result = `${Email.parse("investor@ironcapital.test")}`;

		expect(result).toBe(expectedResult);
	});

	it("should reject an empty input", () => {
		const expectedResult: InvalidEmailReason = "empty";

		const result = reasonOf("   ");

		expect(result).toBe(expectedResult);
	});

	it("should reject an input containing whitespace", () => {
		const expectedResult: InvalidEmailReason = "contains-whitespace";

		const result = reasonOf("in vestor@ironcapital.test");

		expect(result).toBe(expectedResult);
	});

	it("should reject an input with no at-sign", () => {
		const expectedResult: InvalidEmailReason = "missing-at";

		const result = reasonOf("investor.ironcapital.test");

		expect(result).toBe(expectedResult);
	});

	it("should reject an input with multiple at-signs", () => {
		const expectedResult: InvalidEmailReason = "multiple-at";

		const result = reasonOf("investor@corp@ironcapital.test");

		expect(result).toBe(expectedResult);
	});

	it("should reject an input with an empty local part", () => {
		const expectedResult: InvalidEmailReason = "empty-local-part";

		const result = reasonOf("@ironcapital.test");

		expect(result).toBe(expectedResult);
	});

	it("should reject an input with an implausible domain", () => {
		const expectedResult: InvalidEmailReason = "invalid-domain";

		const result = reasonOf("investor@ironcapital");

		expect(result).toBe(expectedResult);
	});

	it("should format InvalidEmail in the bracketed display format", () => {
		const expectedResult =
			"[InvalidEmail] Not a valid email address, Reason: 'missing-at', Input: 'not-an-email'";

		const result = new InvalidEmail("missing-at", "not-an-email").message;

		expect(result).toBe(expectedResult);
	});
});
