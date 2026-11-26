import type { AuthError } from "@supabase/supabase-js";

import { supabase } from "../supabase";
import type { AuthGateway, AuthOutcome } from "./gateway";
import { toAuthFailure, toAuthUser } from "./mappers";

/**
 * The real {@link AuthGateway} adapter — the only place the Supabase auth client
 * and its types are named. Each port method delegates to `supabase.auth.*` and
 * maps the vendor result onto the app's own types.
 */
export function supabaseAuthGateway(): AuthGateway {
	return {
		getCurrentUser: async () => {
			// Validate the token with the auth server (getUser) rather than
			// trusting the locally stored session (getSession), so a revoked or
			// tampered token in storage does not resolve as a signed-in user.
			const {
				data: { user },
			} = await supabase.auth.getUser();
			return toAuthUser(user);
		},
		onUserChange: (listener) => {
			const {
				data: { subscription },
			} = supabase.auth.onAuthStateChange((_event, session) => {
				listener(toAuthUser(session?.user ?? null));
			});
			return () => subscription.unsubscribe();
		},
		sendSignInCode: async (email) => {
			const { error } = await supabase.auth.signInWithOtp({
				email: email.value,
				options: { shouldCreateUser: true },
			});
			return toAuthOutcome(error);
		},
		verifySignInCode: async (email, code) => {
			const { error } = await supabase.auth.verifyOtp({
				email: email.value,
				token: code,
				type: "email",
			});
			return toAuthOutcome(error);
		},
		verifySignInLink: async (tokenHash) => {
			const { error } = await supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: "email",
			});
			return toAuthOutcome(error);
		},
		signInWithProvider: async (provider, returnTo) => {
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: returnTo },
			});
			return toAuthOutcome(error);
		},
		signOut: async () => {
			const { error } = await supabase.auth.signOut();
			return toAuthOutcome(error);
		},
	};
}

function toAuthOutcome(error: AuthError | null): AuthOutcome {
	return { error: error ? toAuthFailure(error) : null };
}
