import { useEffect, useState } from "react";

import type { AuthGateway, AuthUser } from "../lib/auth/gateway";

/**
 * Tracks the current user through an injected {@link AuthGateway} and exposes the
 * user plus sign-in / sign-up / sign-out actions.
 *
 * Why a gateway argument? The hook depends on the app-owned port, not on Supabase
 * directly, so tests inject a fake instead of mocking a vendor module. Pass a
 * stable gateway instance — a fresh one on every render re-runs the subscription.
 */
export function useAuth(gateway: AuthGateway) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		gateway.getCurrentUser().then((currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});

		const unsubscribe = gateway.onUserChange((nextUser) => {
			setUser(nextUser);
			setLoading(false);
		});

		return unsubscribe;
	}, [gateway]);

	const signInWithEmail = (email: string, password: string) =>
		gateway.signInWithEmail(email, password);

	const signUpWithEmail = (email: string, password: string) =>
		gateway.signUpWithEmail(email, password);

	const signOut = () => gateway.signOut();

	return {
		user,
		loading,
		signInWithEmail,
		signUpWithEmail,
		signOut,
	};
}
