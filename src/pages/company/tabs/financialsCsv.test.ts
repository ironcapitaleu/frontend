import { describe, expect, it } from "vitest";

import type { Claim, Figure, IsoDate, Period, Unit } from "@/lib/company/types";
import { csvFileName, statementCsv } from "./financialsCsv";
import type { RowTable, TableRow } from "./financialsTable";

const years = [period(2025), period(2026)];

function period(fiscalYear: number): Period {
	return {
		kind: "fiscalYear",
		fiscalYear,
		fiscalQuarter: null,
		endsOn: `${fiscalYear}-01-25` as IsoDate,
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

function row(
	label: string,
	unit: Unit,
	values: (Claim["value"] | null)[],
	margin = false,
): TableRow {
	const points: Figure[] = values.map((value) =>
		value === null ? null : claim(value, unit),
	);
	return { key: label, label, unit, level: 0, periods: years, points, margin };
}

function table(...lines: TableRow[]): RowTable {
	return { periods: years, lines };
}

describe("statementCsv", () => {
	it("should write a CAGR column when the view is annual", () => {
		const revenue = row("Revenue", "usd", [100e9, 121e9]);

		const expectedResult =
			"Line,FY2025,FY2026,CAGR\r\nRevenue,100.0,121.0,21.0%\r\n";

		const result = statementCsv(table(revenue), "billions", true);

		expect(result).toBe(expectedResult);
	});

	it("should write no CAGR column when the view is quarterly", () => {
		const revenue = row("Revenue", "usd", [100e9, 121e9]);

		const expectedResult = "Line,FY2025,FY2026\r\nRevenue,100.0,121.0\r\n";

		const result = statementCsv(table(revenue), "billions", false);

		expect(result).toBe(expectedResult);
	});

	it("should write a margin as a percent with an empty CAGR when the row is a margin", () => {
		const margin = row("Net margin", "percent", [0.2, 0.25], true);

		const expectedResult =
			"Line,FY2025,FY2026,CAGR\r\nNet margin,20.0%,25.0%,\r\n";

		const result = statementCsv(table(margin), "billions", true);

		expect(result).toBe(expectedResult);
	});

	it("should write an empty cell when a figure is missing", () => {
		const revenue = row("Revenue", "usd", [null, 121e9]);

		const expectedResult = "Line,FY2025,FY2026\r\nRevenue,,121.0\r\n";

		const result = statementCsv(table(revenue), "billions", false);

		expect(result).toBe(expectedResult);
	});

	it("should write an empty CAGR cell when the growth rate has no value", () => {
		const capex = row("Capital expenditure", "usd", [-5e9, -6e9]);

		const expectedResult = "Capital expenditure,-5.0,-6.0,";

		const result = statementCsv(table(capex), "billions", true).split(
			"\r\n",
		)[1];

		expect(result).toBe(expectedResult);
	});

	it("should write a plain minus and no thousands comma when the unit is millions", () => {
		const loss = row("Net income", "usd", [-1234.56e6, 2000e6]);

		const expectedResult = "Net income,-1234.6,2000.0";

		const result = statementCsv(table(loss), "millions", false).split(
			"\r\n",
		)[1];

		expect(result).toBe(expectedResult);
	});

	it("should add the unit note to the line name when the line reads in shares", () => {
		const shares = row("Diluted shares", "shares", [25e9, 24e9]);

		const expectedResult = "Diluted shares (billions of shares),25.0,24.0";

		const result = statementCsv(table(shares), "billions", false).split(
			"\r\n",
		)[1];

		expect(result).toBe(expectedResult);
	});

	it("should quote a field when it holds a comma or a quote", () => {
		const text = row('Plant, "gross"', "usd", ["a,b", null]);

		const expectedResult = '"Plant, ""gross""","a,b",';

		const result = statementCsv(table(text), "billions", false).split(
			"\r\n",
		)[1];

		expect(result).toBe(expectedResult);
	});
});

describe("csvFileName", () => {
	it("should name the ticker, the statement and the period when the table is annual", () => {
		const expectedResult = "MRDN-income-annual.csv";

		const result = csvFileName("MRDN", "income", "annual");

		expect(result).toBe(expectedResult);
	});

	it("should write the cash flow statement in kebab case when the table is quarterly", () => {
		const expectedResult = "MRDN-cash-flow-quarterly.csv";

		const result = csvFileName("MRDN", "cashFlow", "quarterly");

		expect(result).toBe(expectedResult);
	});
});
