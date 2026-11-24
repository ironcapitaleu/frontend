import { describe, expect, it } from "vitest";

import { FailedAuthRequest, InvalidSignInCode } from "./errors";

describe("InvalidSignInCode", () => {
	it("should format its bracketed message when constructed without a reason", () => {
		const failure = new InvalidSignInCode();

		const expectedResult =
			"[InvalidSignInCode] The sign-in code or link was not accepted";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should append the reason tail when constructed with a reason", () => {
		const failure = new InvalidSignInCode("Token has expired or is invalid");

		const expectedResult =
			"[InvalidSignInCode] The sign-in code or link was not accepted, Reason: 'Token has expired or is invalid'";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should take its own class name as the error name when constructed without a reason", () => {
		const failure = new InvalidSignInCode();

		const expectedResult = "InvalidSignInCode";

		const result = failure.name;

		expect(result).toBe(expectedResult);
	});

	it("should expose the vendor message as the reason when constructed with a reason", () => {
		const failure = new InvalidSignInCode("Token has expired or is invalid");

		const expectedResult = "Token has expired or is invalid";

		const result = failure.reason;

		expect(result).toBe(expectedResult);
	});

	it("should expose a null reason when constructed without a reason", () => {
		const failure = new InvalidSignInCode();

		const expectedResult = null;

		const result = failure.reason;

		expect(result).toBe(expectedResult);
	});
});

describe("FailedAuthRequest", () => {
	it("should format its bracketed message when constructed without a reason", () => {
		const failure = new FailedAuthRequest();

		const expectedResult =
			"[FailedAuthRequest] The auth request could not be completed";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should append the reason tail when constructed with a reason", () => {
		const failure = new FailedAuthRequest("service unreachable");

		const expectedResult =
			"[FailedAuthRequest] The auth request could not be completed, Reason: 'service unreachable'";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should take its own class name as the error name when constructed without a reason", () => {
		const failure = new FailedAuthRequest();

		const expectedResult = "FailedAuthRequest";

		const result = failure.name;

		expect(result).toBe(expectedResult);
	});
});
