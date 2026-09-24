import type { IsoDate } from "./types";

/** Writes `date` as the page prints it, such as `12 Mar 2026`. */
export function formatDate(date: IsoDate): string {
	return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}
