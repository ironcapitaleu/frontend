import type { AuthError, User } from "@supabase/supabase-js";

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
 */
export function toAuthFailure(error: AuthError): AuthFailure {
	if (error.code === "otp_expired") {
		return new InvalidSignInCode(error.message);
	}
	return new FailedAuthRequest(error.message);
}
