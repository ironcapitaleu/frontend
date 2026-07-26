/**
 * App-owned auth failures, independent of the auth vendor.
 *
 * Why app-owned? A consumer branches on *what went wrong* (bad credentials vs.
 * the service being down), not on Supabase's error shapes. The real adapter maps
 * the vendor error onto one of these; fakes construct them directly. Following
 * the error Display Format in AGENTS.md, each formats as
 * `[Name] <description>` with an optional `, Reason: '<detail>'` tail.
 */

/**
 * Base class for auth failures. Subclasses supply their bracketed name and a
 * high-level description; callers may pass a `reason` with vendor detail.
 */
export abstract class AuthFailure extends Error {
	protected constructor(name: string, description: string, reason?: string) {
		super(
			reason
				? `[${name}] ${description}, Reason: '${reason}'`
				: `[${name}] ${description}`,
		);
		this.name = name;
	}
}

/** The submitted email or password was not accepted (adjective-first pattern). */
export class InvalidCredentials extends AuthFailure {
	constructor(reason?: string) {
		super(
			"InvalidCredentials",
			"The email or password was not accepted",
			reason,
		);
	}
}

/** A request to the auth service could not be completed (failed-first pattern). */
export class FailedAuthRequest extends AuthFailure {
	constructor(reason?: string) {
		super(
			"FailedAuthRequest",
			"The auth request could not be completed",
			reason,
		);
	}
}
