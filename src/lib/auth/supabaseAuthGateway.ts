import { supabase } from "../supabase";
import type { AuthGateway } from "./gateway";
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
