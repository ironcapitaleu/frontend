import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import {
	COLUMN_GROUPS,
	LEADING_COLUMNS,
	NUMBER_COLUMNS,
	type NumberColumn,
	TRAILING_COLUMNS,
	columnGroups,
} from "./ScreenerTable.logic";

const numberColumn = (group?: string): NumberColumn => ({
	field: "price",
	width: 60,
	label: "Price",
	group,
	format: () => "",
});

describe("columnGroups", () => {
	it("should span every column when groups start at the named columns", () => {
		const columns = [
			numberColumn("A"),
			numberColumn(),
			numberColumn("B"),
			numberColumn(),
		];

		const expectedResult = [
			{ label: "", span: 1 },
			{ label: "A", span: 2 },
			{ label: "B", span: 3 },
		];

		const result = columnGroups(columns);

		expect(result).toEqual(expectedResult);
	});

	it("should name the four groups over the real columns when the table renders", () => {
		const expectedResult = [
			{ label: "", span: LEADING_COLUMNS },
			{ label: "Valuation", span: 4 },
			{ label: "Balance sheet", span: 2 },
			{ label: "Shareholder yield", span: 2 },
			{ label: "Price", span: 2 + TRAILING_COLUMNS },
		];

		const result = COLUMN_GROUPS;

		expect(result).toEqual(expectedResult);
	});
});

describe("NUMBER_COLUMNS", () => {
	it("should mute the 1M change when a stock is flat over the month", () => {
		const flat = { ...fakeStockScreenerResults[0], changePercent1M: 0.02 };
		const change = NUMBER_COLUMNS.find(
			(column) => column.field === "changePercent1M",
		);

		const expectedResult = "text-muted-foreground";

		const result = change?.toneOf?.(flat);

		expect(result).toBe(expectedResult);
	});
});
