import type { AuthError, User } from "@supabase/supabase-js";

import type { AuthFailure } from "./errors";
import { FailedAuthRequest, InvalidCredentials } from "./errors";
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
 * `invalid_credentials` code becomes {@link InvalidCredentials}, anything else
 * {@link FailedAuthRequest}. The vendor message is carried through as the reason.
 */
export function toAuthFailure(error: AuthError): AuthFailure {
	if (error.code === "invalid_credentials") {
		return new InvalidCredentials(error.message);
	}
	return new FailedAuthRequest(error.message);
}
