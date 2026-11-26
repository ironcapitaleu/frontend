import type { AuthGateway } from "../../../lib/auth/gateway";
import { fakeUser } from "./user";

/**
 * An {@link AuthGateway} fake where {@link fakeUser} is always signed in. Use it
 * to arrange the authenticated world.
 */
export function alwaysAuthenticatedAuth(): AuthGateway {
	return {
		getCurrentUser: async () => fakeUser,
		onUserChange: () => () => {},
		sendSignInCode: async () => ({ error: null }),
		verifySignInCode: async () => ({ error: null }),
		verifySignInLink: async () => ({ error: null }),
		signInWithProvider: async () => ({ error: null }),
		signOut: async () => ({ error: null }),
	};
}
