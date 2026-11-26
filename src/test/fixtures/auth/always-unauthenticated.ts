import { InvalidSignInCode } from "../../../lib/auth/errors";
import type { AuthGateway } from "../../../lib/auth/gateway";

/**
 * An {@link AuthGateway} fake where nobody is signed in. The sign-in mail goes
 * out, and every code and link is rejected. Use it to arrange the signed-out
 * world (the default of the custom test `render`).
 */
export function alwaysUnauthenticatedAuth(): AuthGateway {
	return {
		getCurrentUser: async () => null,
		onUserChange: () => () => {},
		sendSignInCode: async () => ({ error: null }),
		verifySignInCode: async () => ({
			error: new InvalidSignInCode("Token has expired or is invalid"),
		}),
		verifySignInLink: async () => ({
			error: new InvalidSignInCode("Email link is invalid or has expired"),
		}),
		signInWithProvider: async () => ({ error: null }),
		signOut: async () => ({ error: null }),
	};
}
