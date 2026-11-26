import { FailedAuthRequest } from "../../../lib/auth/errors";
import type { AuthGateway } from "../../../lib/auth/gateway";

/**
 * An {@link AuthGateway} fake where every call fails, as if the auth backend were
 * unreachable. Use it to arrange the error path.
 */
export function alwaysFailingAuth(): AuthGateway {
	const failure = async () => ({
		error: new FailedAuthRequest("Auth service unavailable"),
	});
	return {
		getCurrentUser: async () => null,
		onUserChange: () => () => {},
		sendSignInCode: failure,
		verifySignInCode: failure,
		verifySignInLink: failure,
		signInWithProvider: failure,
		signOut: failure,
	};
}
