import type { AuthFailure } from "./errors";

/**
 * The authenticated user, in the app's own vocabulary — only the fields the app
 * actually uses. The vendor's richer `User`/`Session` types never cross this
 * boundary; the real adapter maps them down to this.
 */
export interface AuthUser {
	id: string;
	email: string | null;
}

/**
 * The outcome of an auth mutation: `null` on success, an app-owned
 * {@link AuthFailure} otherwise.
 */
export interface AuthOutcome {
	error: AuthFailure | null;
}

/**
 * The app's port for authentication: what the app needs from an auth backend,
 * in the app's own vocabulary, with the vendor concealed. Neither Supabase nor
 * any of its types appear here.
 *
 * Why a port? The real adapter ({@link supabaseAuthGateway}) wraps Supabase and
 * is the only place the vendor is named; test fakes (`always{Behaviour}Auth`)
 * implement this same interface with fixed behaviour. Both are injected through
 * `AuthProvider`'s `gateway` prop, so nothing that consumes auth depends on the
 * vendor directly.
 */
export interface AuthGateway {
	/** Resolves the current user, or `null` when nobody is signed in. */
	getCurrentUser(): Promise<AuthUser | null>;
	/**
	 * Subscribes to sign-in / sign-out changes; returns the unsubscribe function
	 * to run on teardown.
	 */
	onUserChange(listener: (user: AuthUser | null) => void): () => void;
	/** Signs in an existing user with email and password. */
	signInWithEmail(email: string, password: string): Promise<AuthOutcome>;
	/** Registers a new user with email and password. */
	signUpWithEmail(email: string, password: string): Promise<AuthOutcome>;
	/** Signs the current user out. */
	signOut(): Promise<AuthOutcome>;
}
