import {
	type AuthError,
	isAuthRetryableFetchError,
	type User,
} from "@supabase/supabase-js";

import {
	type AuthFailure,
	FailedAuthRequest,
	InvalidSignInCode,
} from "./errors";
import type { AuthUser } from "./gateway";

/**
 * Maps the vendor `User` down to the app's {@link AuthUser}.
 *
 * Vendor-free pure logic: the Supabase auth client is never touched here, so the
 * mapping is unit-tested directly while the `supabase.auth.*` delegation in
 * {@link supabaseAuthGateway} stays integration territory.
 */
export function toAuthUser(user: User | null): AuthUser | null {
	if (!user) {
		return null;
	}
	return { id: user.id, email: user.email ?? null };
}

/**
 * Maps a Supabase `AuthError` onto an app-owned {@link AuthFailure}: the
 * `otp_expired` code becomes {@link InvalidSignInCode}, anything else
 * {@link FailedAuthRequest}. The vendor message is carried through as the reason.
 *
 * Supabase answers `otp_expired` for a wrong code and for a used or expired
 * code or link alike.
 *
 * A failed fetch, or an answer with a status from `500` to `504` or from `520`
 * to `530`, becomes a {@link FailedAuthRequest} with no reason. Supabase marks
 * these errors as retryable, and their vendor message, such as "Failed to
 * fetch", tells the visitor nothing.
 */
export function toAuthFailure(error: AuthError): AuthFailure {
	if (isAuthRetryableFetchError(error)) {
		return new FailedAuthRequest();
	}
	if (error.code === "otp_expired") {
		return new InvalidSignInCode(error.message);
	}
	return new FailedAuthRequest(error.message);
}
