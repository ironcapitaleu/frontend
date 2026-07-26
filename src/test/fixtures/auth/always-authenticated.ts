import type { AuthGateway } from "../../../lib/auth/gateway";
import { fakeSession } from "./session";

/**
 * An {@link AuthGateway} fake where {@link fakeUser} is always signed in. Use it
 * to arrange the authenticated world.
 */
export function alwaysAuthenticatedAuth(): AuthGateway {
	const success = {
		data: { session: fakeSession, user: fakeSession.user },
		error: null,
	};
	return {
		getSession: async () => fakeSession,
		onAuthChange: () => () => {},
		signInWithEmail: async () => success,
		signUpWithEmail: async () => success,
		signOut: async () => ({ error: null }),
	};
}
