import { describe, expect, it } from "vitest";

import { FailedAuthRequest, InvalidCredentials } from "./errors";

describe("InvalidCredentials", () => {
	it("should format its bracketed message when constructed without a reason", () => {
		const failure = new InvalidCredentials();

		const expectedResult =
			"[InvalidCredentials] The email or password was not accepted";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should append the reason tail when constructed with a reason", () => {
		const failure = new InvalidCredentials("wrong password");

		const expectedResult =
			"[InvalidCredentials] The email or password was not accepted, Reason: 'wrong password'";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should take its own class name as the error name", () => {
		const failure = new InvalidCredentials();

		const expectedResult = "InvalidCredentials";

		const result = failure.name;

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

	it("should take its own class name as the error name", () => {
		const failure = new FailedAuthRequest();

		const expectedResult = "FailedAuthRequest";

		const result = failure.name;

		expect(result).toBe(expectedResult);
	});
});
