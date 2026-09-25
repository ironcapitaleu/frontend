import { MISSING } from "@/components/screener/format";
import type { IsoDate } from "./types";

/**
 * Writes `date` as the page prints it, such as `12 Mar 2026`. It writes the
 * dash when `date` is not a real `YYYY-MM-DD` date, such as `2026-02-30`.
 */
export function formatDate(date: IsoDate): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
		Number.isNaN(parsed.getTime()) ||
		!parsed.toISOString().startsWith(date)
	) {
		return MISSING;
	}
	return parsed.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}
