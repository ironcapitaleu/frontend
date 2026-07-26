import { InvalidCredentials } from "../../../lib/auth/errors";
import type { AuthGateway } from "../../../lib/auth/gateway";

/**
 * An {@link AuthGateway} fake where nobody is signed in and credential sign-in is
 * rejected. Use it to arrange the signed-out world (the default of the custom
 * test `render`).
 */
export function alwaysUnauthenticatedAuth(): AuthGateway {
	return {
		getCurrentUser: async () => null,
		onUserChange: () => () => {},
		signInWithEmail: async () => ({ error: new InvalidCredentials() }),
		signUpWithEmail: async () => ({ error: new InvalidCredentials() }),
		signOut: async () => ({ error: null }),
	};
}
