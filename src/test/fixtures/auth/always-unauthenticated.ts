import { AuthError } from "@supabase/supabase-js";

import type { AuthGateway } from "../../../lib/auth/gateway";

/**
 * An {@link AuthGateway} fake where nobody is signed in and credential sign-in is
 * rejected. Use it to arrange the signed-out world (the default of the custom
 * test `render`).
 */
export function alwaysUnauthenticatedAuth(): AuthGateway {
	const rejected = {
		data: null,
		error: new AuthError("Invalid login credentials"),
	};
	return {
		getSession: async () => null,
		onAuthChange: () => () => {},
		signInWithEmail: async () => rejected,
		signUpWithEmail: async () => rejected,
		signOut: async () => ({ error: null }),
	};
}
