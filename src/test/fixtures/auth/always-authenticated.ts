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
		signInWithEmail: async () => ({ error: null }),
		signUpWithEmail: async () => ({ error: null }),
		signOut: async () => ({ error: null }),
	};
}
