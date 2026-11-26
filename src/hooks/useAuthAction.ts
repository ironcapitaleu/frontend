import { useCallback, useState } from "react";

import type { AuthOutcome } from "../lib/auth/gateway";

/** The message a page shows when a failure carries no vendor message. */
export const FALLBACK_AUTH_ERROR =
	"The sign-in service did not answer. Try again.";

/**
 * Runs one auth action at a time and holds its pending flag and its error
 * message for a page to render.
 *
 * `run` resolves `true` when the action succeeds. On a failure, `error` holds
 * the vendor message of the failure, or {@link FALLBACK_AUTH_ERROR} when it has
 * none or when the action throws. `showError` sets a message without a call, for
 * example after a form check fails.
 */
export function useAuthAction() {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(
		async (action: () => Promise<AuthOutcome>): Promise<boolean> => {
			setPending(true);
			setError(null);
			try {
				const outcome = await action();
				if (outcome.error) {
					setError(outcome.error.reason ?? FALLBACK_AUTH_ERROR);
					return false;
				}
				return true;
			} catch {
				setError(FALLBACK_AUTH_ERROR);
				return false;
			} finally {
				setPending(false);
			}
		},
		[],
	);

	return { pending, error, run, showError: setError };
}
