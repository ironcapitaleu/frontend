import { supabase } from "../supabase";
import type { AuthGateway } from "./gateway";

/**
 * The real {@link AuthGateway} adapter — the only place the Supabase auth client
 * is named. Each port method delegates to `supabase.auth.*`.
 */
export function supabaseAuthGateway(): AuthGateway {
	return {
		getSession: async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			return session;
		},
		onAuthChange: (listener) => {
			const {
				data: { subscription },
			} = supabase.auth.onAuthStateChange((_event, session) => {
				listener(session);
			});
			return () => subscription.unsubscribe();
		},
		signInWithEmail: (email, password) =>
			supabase.auth.signInWithPassword({ email, password }),
		signUpWithEmail: (email, password) =>
			supabase.auth.signUp({ email, password }),
		signOut: () => supabase.auth.signOut(),
	};
}
