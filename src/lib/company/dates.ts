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

/**
 * Returns the reader's own calendar day of `date`, such as `2026-09-25`. It
 * reads the local date, not the UTC date of `toISOString`, so an evening print
 * west of Greenwich still carries its own day.
 */
export function localIsoDate(date: Date): IsoDate {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}` as IsoDate;
}
