import { FailedAuthRequest } from "../../../lib/auth/errors";
import type { AuthGateway } from "../../../lib/auth/gateway";

/**
 * An {@link AuthGateway} fake where every call fails, as if the auth backend were
 * unreachable. Use it to arrange the error path.
 */
export function alwaysFailingAuth(): AuthGateway {
	return {
		getCurrentUser: async () => null,
		onUserChange: () => () => {},
		signInWithEmail: async () => ({ error: new FailedAuthRequest() }),
		signUpWithEmail: async () => ({ error: new FailedAuthRequest() }),
		signOut: async () => ({ error: new FailedAuthRequest() }),
	};
}
