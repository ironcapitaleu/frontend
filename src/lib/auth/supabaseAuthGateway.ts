import type { AuthError, User } from "@supabase/supabase-js";

import { supabase } from "../supabase";
import { FailedAuthRequest, InvalidCredentials } from "./errors";
import type { AuthFailure, AuthGateway, AuthUser } from "./gateway";

/** Maps the vendor `User` down to the app's {@link AuthUser}. */
function toAuthUser(user: User | null): AuthUser | null {
	if (!user) {
		return null;
	}
	return { id: user.id, email: user.email ?? null };
}

/** Maps a Supabase `AuthError` onto an app-owned {@link AuthFailure}. */
function toAuthFailure(error: AuthError): AuthFailure {
	if (error.code === "invalid_credentials" || error.status === 400) {
		return new InvalidCredentials(error.message);
	}
	return new FailedAuthRequest(error.message);
}

/**
 * The real {@link AuthGateway} adapter — the only place the Supabase auth client
 * and its types are named. Each port method delegates to `supabase.auth.*` and
 * maps the vendor result onto the app's own types.
 */
export function supabaseAuthGateway(): AuthGateway {
	return {
		getCurrentUser: async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			return toAuthUser(session?.user ?? null);
		},
		onUserChange: (listener) => {
			const {
				data: { subscription },
			} = supabase.auth.onAuthStateChange((_event, session) => {
				listener(toAuthUser(session?.user ?? null));
			});
			return () => subscription.unsubscribe();
		},
		signInWithEmail: async (email, password) => {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			return { error: error ? toAuthFailure(error) : null };
		},
		signUpWithEmail: async (email, password) => {
			const { error } = await supabase.auth.signUp({ email, password });
			return { error: error ? toAuthFailure(error) : null };
		},
		signOut: async () => {
			const { error } = await supabase.auth.signOut();
			return { error: error ? toAuthFailure(error) : null };
		},
	};
}
