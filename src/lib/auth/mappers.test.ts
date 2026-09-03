import { AuthError, type User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { FailedAuthRequest, InvalidCredentials } from "./errors";
import { toAuthFailure, toAuthUser } from "./mappers";

/** A vendor `User` carrying only the fields {@link toAuthUser} reads. */
function makeUser(overrides: Partial<User> = {}): User {
	return {
		id: "user-1",
		email: "investor@ironcapital.test",
		...overrides,
	} as unknown as User;
}

describe("toAuthUser", () => {
	it("should return null when there is no user", () => {
		const expectedResult = null;

		const result = toAuthUser(null);

		expect(result).toBe(expectedResult);
	});

	it("should map id and email when given a user", () => {
		const user = makeUser({ id: "abc", email: "a@b.test" });

		const expectedResult = { id: "abc", email: "a@b.test" };

		const result = toAuthUser(user);

		expect(result).toEqual(expectedResult);
	});

	it("should map a missing email to null when the email is undefined", () => {
		const user = makeUser({ email: undefined });

		const expectedResult = { id: "user-1", email: null };

		const result = toAuthUser(user);

		expect(result).toEqual(expectedResult);
	});
});

describe("toAuthFailure", () => {
	it("should map to InvalidCredentials when the error code is invalid_credentials", () => {
		const error = new AuthError(
			"Invalid login credentials",
			400,
			"invalid_credentials",
		);

		const failure = toAuthFailure(error);

		expect(failure).toBeInstanceOf(InvalidCredentials);
	});

	it("should map to FailedAuthRequest when the error code is not invalid_credentials", () => {
		const error = new AuthError("Service down", 503, "over_request_rate_limit");

		const failure = toAuthFailure(error);

		expect(failure).toBeInstanceOf(FailedAuthRequest);
	});

	it("should carry the vendor message through as the reason when mapping an error", () => {
		const error = new AuthError(
			"Invalid login credentials",
			400,
			"invalid_credentials",
		);

		const expectedResult =
			"[InvalidCredentials] The email or password was not accepted, Reason: 'Invalid login credentials'";

		const result = toAuthFailure(error).message;

		expect(result).toBe(expectedResult);
	});
});
