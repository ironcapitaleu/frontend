import type { Email } from "../domain/email";
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

/** An OAuth provider that a visitor can sign in with. */
export type OAuthProvider = "google" | "github";

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
 *
 * Sign-in has no password. The visitor gets a mail with a 6-digit code and a
 * link, or signs in with an OAuth provider. The same calls sign in a known email
 * and create the account for a new email.
 *
 * A method must not depend on `this`, because `useAuth` passes the methods on
 * without their object.
 */
export interface AuthGateway {
	/** Resolves the current user, or `null` when nobody is signed in. */
	getCurrentUser(): Promise<AuthUser | null>;
	/**
	 * Subscribes to sign-in / sign-out changes; returns the unsubscribe function
	 * to run on teardown.
	 */
	onUserChange(listener: (user: AuthUser | null) => void): () => void;
	/**
	 * Sends the sign-in mail to `email`, and creates the account if the email is
	 * new. The outcome is the same for a known and a new email.
	 */
	sendSignInCode(email: Email): Promise<AuthOutcome>;
	/** Signs in with the 6-digit `code` from the mail sent to `email`. */
	verifySignInCode(email: Email, code: string): Promise<AuthOutcome>;
	/** Signs in with the token hash from the link in the sign-in mail. */
	verifySignInLink(tokenHash: string): Promise<AuthOutcome>;
	/**
	 * Sends the browser to `provider` to sign in. The provider returns the
	 * visitor to the URL `returnTo`.
	 */
	signInWithProvider(
		provider: OAuthProvider,
		returnTo: string,
	): Promise<AuthOutcome>;
	/** Signs the current user out. */
	signOut(): Promise<AuthOutcome>;
}
