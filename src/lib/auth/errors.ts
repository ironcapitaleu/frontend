/**
 * App-owned auth failures, independent of the auth vendor.
 *
 * Why app-owned? A consumer branches on *what went wrong* (a rejected sign-in
 * code vs. the service being down), not on Supabase's error shapes. The real
 * adapter maps the vendor error onto one of these; fakes construct them
 * directly. Each formats in the bracketed display format — `[Name] <description>`
 * with an optional `, Reason: '<detail>'` tail.
 */

/**
 * Base class for auth failures. Subclasses supply their bracketed name and a
 * high-level description; callers may pass a `reason` with vendor detail.
 */
export abstract class AuthFailure extends Error {
	/** The vendor message, or `null` if the failure carries none. Pages show it to the visitor. */
	readonly reason: string | null;

	protected constructor(name: string, description: string, reason?: string) {
		super(
			reason
				? `[${name}] ${description}, Reason: '${reason}'`
				: `[${name}] ${description}`,
		);
		this.name = name;
		this.reason = reason ?? null;
	}
}

/** The sign-in code or link is wrong, used, or expired. */
export class InvalidSignInCode extends AuthFailure {
	constructor(reason?: string) {
		super(
			"InvalidSignInCode",
			"The sign-in code or link was not accepted",
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
