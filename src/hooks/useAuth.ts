import { useEffect, useState } from "react";

import type { AuthGateway, AuthUser } from "../lib/auth/gateway";

/** The actions of an {@link AuthGateway} that sign a visitor in or out. */
export type AuthActions = Pick<
	AuthGateway,
	| "sendSignInCode"
	| "verifySignInCode"
	| "verifySignInLink"
	| "signInWithProvider"
	| "signOut"
>;

/** The current user, whether the first lookup still runs, and the auth actions. */
export interface AuthState extends AuthActions {
	user: AuthUser | null;
	loading: boolean;
}

/**
 * Tracks the current user through an injected {@link AuthGateway} and exposes the
 * user plus the sign-in and sign-out actions.
 *
 * Why a gateway argument? The hook depends on the app-owned port, not on Supabase
 * directly, so tests inject a fake instead of mocking a vendor module. Pass a
 * stable gateway instance. A fresh one on every render runs the subscription
 * again.
 */
export function useAuth(gateway: AuthGateway): AuthState {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		gateway
			.getCurrentUser()
			.then((currentUser) => {
				setUser(currentUser);
				setLoading(false);
			})
			.catch(() => {
				// Gateway unreachable — treat as signed-out and unblock the app
				// rather than leaving it stuck on the loading state forever.
				setLoading(false);
			});

		const unsubscribe = gateway.onUserChange((nextUser) => {
			setUser(nextUser);
			setLoading(false);
		});

		return unsubscribe;
	}, [gateway]);

	return {
		user,
		loading,
		sendSignInCode: gateway.sendSignInCode,
		verifySignInCode: gateway.verifySignInCode,
		verifySignInLink: gateway.verifySignInLink,
		signInWithProvider: gateway.signInWithProvider,
		signOut: gateway.signOut,
	};
}
