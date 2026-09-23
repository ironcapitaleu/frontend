import { describe, expect, it } from "vitest";

import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import {
	COLUMN_COUNT,
	COLUMN_GROUPS,
	NUMBER_COLUMNS,
	type NumberColumn,
	columnGroups,
} from "./ScreenerTable.logic";

const column = (group?: string): NumberColumn => ({
	field: "price",
	label: "Price",
	group,
	format: () => "",
});

describe("columnGroups", () => {
	it("should span every column when groups start at the named columns", () => {
		const columns = [column("A"), column(), column("B"), column()];

		const expectedResult = [
			{ label: "", span: 1 },
			{ label: "A", span: 2 },
			{ label: "B", span: 3 },
		];

		const result = columnGroups(columns);

		expect(result).toEqual(expectedResult);
	});

	it("should span every column when the groups derive from the real columns", () => {
		const expectedResult = COLUMN_COUNT;

		const result = COLUMN_GROUPS.reduce(
			(total, group) => total + group.span,
			0,
		);

		expect(result).toBe(expectedResult);
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
