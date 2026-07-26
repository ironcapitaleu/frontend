import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { Session, User } from "@supabase/supabase-js";

import { useAuth } from "../hooks/useAuth";
import type { AuthGateway } from "../lib/auth/gateway";
import { supabaseAuthGateway } from "../lib/auth/supabaseAuthGateway";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signInWithEmail: (
		email: string,
		password: string,
	) => Promise<{ data: unknown; error: unknown }>;
	signUpWithEmail: (
		email: string,
		password: string,
	) => Promise<{ data: unknown; error: unknown }>;
	signOut: () => Promise<{ error: unknown }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The production auth gateway, created once so the `useAuth` subscription stays
 * stable across renders. Tests inject their own fake via the `gateway` prop.
 */
const defaultGateway = supabaseAuthGateway();

/**
 * Provides auth state to the tree via an injected {@link AuthGateway}.
 *
 * Why the `gateway` prop? Production uses the real Supabase adapter (the
 * default); tests pass a fake so no test touches the network.
 */
export function AuthProvider({
	children,
	gateway = defaultGateway,
}: {
	children: ReactNode;
	gateway?: AuthGateway;
}) {
	const auth = useAuth(gateway);

	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Returns the auth context of the nearest {@link AuthProvider}.
 *
 * @throws Error when used outside an `AuthProvider` — every consumer must sit
 * under the provider.
 */
export function useAuthContext() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
}
