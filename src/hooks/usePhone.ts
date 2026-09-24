import { useSyncExternalStore } from "react";

/**
 * The width below which the page is a phone (DESIGN.md §8 "Shared Layout").
 * It stops just short of Tailwind's `md` at 768 px, so a fractional width
 * such as 767.5 px is a phone too.
 */
export const PHONE_QUERY = "(max-width: 767.98px)";

/**
 * Returns `true` while the screen is narrower than 768 px, the width below
 * which DESIGN.md lays a page out for a phone. It updates when the width
 * crosses the line.
 */
export function usePhone(): boolean {
	return useSyncExternalStore(subscribeToPhone, isPhone);
}

function isPhone(): boolean {
	return window.matchMedia(PHONE_QUERY).matches;
}

function subscribeToPhone(onChange: () => void): () => void {
	const query = window.matchMedia(PHONE_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}
