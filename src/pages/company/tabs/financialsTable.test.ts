import { describe, expect, it } from "vitest";

import type { Claim, IsoDate, Period, Unit } from "@/lib/company/types";
import {
	formatStatementValue,
	periodLabel,
	tableCaption,
} from "./financialsTable";

function period(fiscalYear: number, fiscalQuarter: number | null): Period {
	return {
		kind: fiscalQuarter === null ? "fiscalYear" : "fiscalQuarter",
		fiscalYear,
		fiscalQuarter,
		endsOn: "2026-01-25" as IsoDate,
	};
}

function claim(value: Claim["value"], unit: Unit): Claim {
	return {
		id: "test.claim",
		label: "Test",
		value,
		unit,
		period: null,
		source: { kind: "derived", formula: "test", inputs: [] as never },
	};
}

describe("periodLabel", () => {
	it("should write the fiscal year when the period has no quarter", () => {
		const expectedResult = "FY2026";

		const result = periodLabel(period(2026, null));

		expect(result).toBe(expectedResult);
	});

	it("should write the quarter before the fiscal year when the period has a quarter", () => {
		const expectedResult = "Q2 FY2027";

		const result = periodLabel(period(2027, 2));

		expect(result).toBe(expectedResult);
	});
});

describe("tableCaption", () => {
	it("should name the first and last period, the unit and the 10-K when the view is annual", () => {
		const table = {
			periods: [period(2017, null), period(2026, null)],
			lines: [],
		};

		const expectedResult = "FY2017–FY2026 · USD billions · 10-K";

		const result = tableCaption(table, "annual", "billions");

		expect(result).toBe(expectedResult);
	});

	it("should name the 10-Q and the 10-K when the view is quarterly", () => {
		const table = { periods: [period(2025, 3), period(2027, 2)], lines: [] };

		const expectedResult = "Q3 FY2025–Q2 FY2027 · USD millions · 10-Q and 10-K";

		const result = tableCaption(table, "quarterly", "millions");

		expect(result).toBe(expectedResult);
	});
});

describe("formatStatementValue", () => {
	it("should write a dollar figure in billions with one decimal when the unit is billions", () => {
		const expectedResult = "212.0";

		const result = formatStatementValue(claim(212e9, "usd"), "billions");

		expect(result).toBe(expectedResult);
	});

	it("should write a share count in millions with a comma between thousands when the unit is millions", () => {
		const expectedResult = "24,500.0";

		const result = formatStatementValue(claim(24.5e9, "shares"), "millions");

		expect(result).toBe(expectedResult);
	});

	it("should write a loss with a true minus when the dollar figure is negative", () => {
		const expectedResult = "−1.5";

		const result = formatStatementValue(claim(-1.5e9, "usd"), "billions");

		expect(result).toBe(expectedResult);
	});

	it("should write no sign when a negative figure rounds to zero", () => {
		const expectedResult = "0.0";

		const result = formatStatementValue(claim(-0.01e9, "usd"), "billions");

		expect(result).toBe(expectedResult);
	});

	it("should keep the cents of a per-share figure when the unit is billions", () => {
		const expectedResult = "5.51";

		const result = formatStatementValue(claim(5.51, "usdPerShare"), "billions");

		expect(result).toBe(expectedResult);
	});

	it("should keep a text value as it is when the claim holds text", () => {
		const expectedResult = "n/a";

		const result = formatStatementValue(claim("n/a", "text"), "billions");

		expect(result).toBe(expectedResult);
	});
});
