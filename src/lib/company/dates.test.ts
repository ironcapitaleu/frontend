import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { formatDate, localIsoDate } from "./dates";
import type { IsoDate } from "./types";

describe("formatDate", () => {
	it("should write the day, the short month and the year when given an ISO date", () => {
		const expectedResult = "12 Mar 2026";

		const result = formatDate("2026-03-12" as IsoDate);

		expect(result).toBe(expectedResult);
	});

	it.each(["2026-02-30", "2026-13-01", "", "12/03/2026"])(
		"should write the dash when the date is %j, which is not a real date",
		(date) => {
			const expectedResult = "—";

			const result = formatDate(date as IsoDate);

			expect(result).toBe(expectedResult);
		},
	);
});

describe("localIsoDate", () => {
	// A zone west of Greenwich, where an evening is already the next UTC day.
	const zone = process.env.TZ;
	beforeEach(() => {
		process.env.TZ = "America/Los_Angeles";
	});
	afterEach(() => {
		process.env.TZ = zone;
	});

	it("should return the local day when the UTC day has already turned", () => {
		const evening = new Date(2026, 8, 25, 20, 30);

		const expectedResult = "2026-09-25";

		const result = localIsoDate(evening);

		expect(result).toBe(expectedResult);
	});
});
