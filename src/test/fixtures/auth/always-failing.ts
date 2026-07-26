import { AuthError } from "@supabase/supabase-js";

import type { AuthGateway } from "../../../lib/auth/gateway";

/**
 * An {@link AuthGateway} fake where every call fails, as if the auth backend were
 * unreachable. Use it to arrange the error path.
 */
export function alwaysFailingAuth(): AuthGateway {
	const error = new AuthError("Auth service unavailable");
	return {
		getSession: async () => null,
		onAuthChange: () => () => {},
		signInWithEmail: async () => ({ data: null, error }),
		signUpWithEmail: async () => ({ data: null, error }),
		signOut: async () => ({ error }),
	};
}
