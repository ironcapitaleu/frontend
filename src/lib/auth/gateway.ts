import type { AuthError, Session } from "@supabase/supabase-js";

/**
 * Result of an auth mutation (sign-in / sign-up).
 *
 * Why is `data` untyped? Consumers branch on `error`; the success payload is not
 * part of what the app needs from the gateway, so the port leaves it opaque
 * rather than pinning it to a vendor response shape.
 */
export interface AuthResult {
	data: unknown;
	error: AuthError | null;
}

/**
 * The app's port for authentication: what the app needs from an auth backend,
 * in the app's own vocabulary, with the vendor concealed.
 *
 * Why a port? The real adapter ({@link supabaseAuthGateway}) wraps Supabase and
 * is the only place the vendor is named; test fakes (`always{Behaviour}Auth`)
 * implement this same interface with fixed behaviour. Both are injected through
 * `AuthProvider`'s `gateway` prop, so nothing that consumes auth depends on the
 * vendor directly.
 */
export interface AuthGateway {
	/** Resolves the current session, or `null` when nobody is signed in. */
	getSession(): Promise<Session | null>;
	/**
	 * Subscribes to session changes; returns the unsubscribe function to run on
	 * teardown.
	 */
	onAuthChange(listener: (session: Session | null) => void): () => void;
	/** Signs in an existing user with email and password. */
	signInWithEmail(email: string, password: string): Promise<AuthResult>;
	/** Registers a new user with email and password. */
	signUpWithEmail(email: string, password: string): Promise<AuthResult>;
	/** Signs the current user out. */
	signOut(): Promise<{ error: AuthError | null }>;
}
