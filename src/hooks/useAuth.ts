import { useEffect, useState } from "react";

import type { Session, User } from "@supabase/supabase-js";

import type { AuthGateway } from "../lib/auth/gateway";

/**
 * Tracks the current auth session through an injected {@link AuthGateway} and
 * exposes the session state plus sign-in / sign-up / sign-out actions.
 *
 * Why a gateway argument? The hook depends on the app-owned port, not on Supabase
 * directly, so tests inject a fake instead of mocking a vendor module. Pass a
 * stable gateway instance — a fresh one on every render re-runs the subscription.
 */
export function useAuth(gateway: AuthGateway) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		gateway.getSession().then((initialSession) => {
			setSession(initialSession);
			setUser(initialSession?.user ?? null);
			setLoading(false);
		});

		const unsubscribe = gateway.onAuthChange((nextSession) => {
			setSession(nextSession);
			setUser(nextSession?.user ?? null);
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
		session,
		loading,
		signInWithEmail,
		signUpWithEmail,
		signOut,
	};
}
