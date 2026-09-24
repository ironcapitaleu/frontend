import { describe, expect, it } from "vitest";

import { formatDate } from "./dates";
import type { IsoDate } from "./types";

describe("formatDate", () => {
	it("should write the day, the short month and the year when given an ISO date", () => {
		const expectedResult = "12 Mar 2026";

		const result = formatDate("2026-03-12" as IsoDate);

		expect(result).toBe(expectedResult);
	});
});
