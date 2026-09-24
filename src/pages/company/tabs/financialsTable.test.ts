import { describe, expect, it } from "vitest";

import type {
	Claim,
	IsoDate,
	Period,
	StatementLine,
	Unit,
} from "@/lib/company/types";
import {
	barScale,
	chartTable,
	formatStatementValue,
	lineUnitNote,
	MIN_BAR_HEIGHT,
	newestFirst,
	periodLabel,
	tableCaption,
	toTitle,
} from "./financialsTable";

function period(fiscalYear: number, fiscalQuarter: number | null): Period {
	return {
		kind: fiscalQuarter === null ? "fiscalYear" : "fiscalQuarter",
		fiscalYear,
		fiscalQuarter,
		endsOn: "2026-01-25" as IsoDate,
	};
}

function line(unit: Unit, periods: Period[], values: number[]): StatementLine {
	return {
		key: "revenue",
		label: "Revenue",
		unit,
		level: 0,
		periods,
		points: values.map((value) => claim(value, unit)),
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

describe("toTitle", () => {
	it("should capitalise each word when the label is in sentence case", () => {
		const expectedResult = "Income Statement";

		const result = toTitle("Income statement");

		expect(result).toBe(expectedResult);
	});
});

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

	it("should say the unit holds unless noted when a line reads in shares", () => {
		const periods = [period(2017, null), period(2026, null)];
		const table = { periods, lines: [line("shares", periods, [25e9, 24e9])] };

		const expectedResult = "FY2017–FY2026 · USD billions unless noted · 10-K";

		const result = tableCaption(table, "annual", "billions");

		expect(result).toBe(expectedResult);
	});
});

describe("lineUnitNote", () => {
	it("should name the scale of shares when the line counts shares", () => {
		const expectedResult = "millions of shares";

		const result = lineUnitNote("shares", "millions");

		expect(result).toBe(expectedResult);
	});

	it("should name dollars per share when the line is a per-share figure", () => {
		const expectedResult = "USD per share";

		const result = lineUnitNote("usdPerShare", "billions");

		expect(result).toBe(expectedResult);
	});

	it("should give no note when the line reads in dollars", () => {
		const expectedResult = null;

		const result = lineUnitNote("usd", "billions");

		expect(result).toBe(expectedResult);
	});
});

describe("newestFirst", () => {
	it("should put the newest period first and keep each point under its period when the table runs oldest first", () => {
		const periods = [
			period(2024, null),
			period(2025, null),
			period(2026, null),
		];
		const table = { periods, lines: [line("usd", periods, [1, 2, 3])] };

		const expectedResult = {
			headers: ["FY2026", "FY2025", "FY2024"],
			values: [3, 2, 1],
		};

		const reversed = newestFirst(table);
		const result = {
			headers: reversed.periods.map(periodLabel),
			values: reversed.lines[0]?.points.map((point) => point?.value),
		};

		expect(result).toEqual(expectedResult);
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

	it("should write a fraction as a percent with one decimal when the unit is percent", () => {
		const expectedResult = "15.0%";

		const result = formatStatementValue(claim(0.15, "percent"), "billions");

		expect(result).toBe(expectedResult);
	});

	it("should write NaN rather than a zero when the value is not a number", () => {
		const expectedResult = "NaN";

		const result = formatStatementValue(claim(Number.NaN, "usd"), "billions");

		expect(result).toBe(expectedResult);
	});

	it("should keep a text value as it is when the claim holds text", () => {
		const expectedResult = "n/a";

		const result = formatStatementValue(claim("n/a", "text"), "billions");

		expect(result).toBe(expectedResult);
	});
});

describe("chartTable", () => {
	it("should keep the chart lines in their chart order when the table lists them in another", () => {
		const periods = [period(2026, null)];
		const netIncome = {
			...line("usd", periods, [1]),
			key: "netIncome" as const,
		};
		const table = { periods, lines: [netIncome, line("usd", periods, [2])] };

		const expectedResult = ["revenue", "netIncome"];

		const result = chartTable(table, ["revenue", "netIncome"]).lines.map(
			({ key }) => key,
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("barScale", () => {
	const periods = [period(2025, null), period(2026, null)];

	it("should draw a negative value below the zero line when a line holds one", () => {
		const { place } = barScale({
			periods,
			lines: [line("usd", periods, [3, -1])],
		});

		const expectedResult = { top: 75, height: 25 };

		const result = place(-1);

		expect(result).toEqual(expectedResult);
	});

	it("should put the zero line at the foot of the plot when every value is zero", () => {
		const table = { periods, lines: [line("usd", periods, [0, 0])] };

		const expectedResult = 100;

		const result = barScale(table).zero;

		expect(result).toBe(expectedResult);
	});

	it("should draw a small value at the least bar height when it is far below the largest value", () => {
		const { place } = barScale({
			periods,
			lines: [line("usd", periods, [1000, 1])],
		});

		const expectedResult = {
			top: 100 - MIN_BAR_HEIGHT,
			height: MIN_BAR_HEIGHT,
		};

		const result = place(1);

		expect(result).toEqual(expectedResult);
	});
});
