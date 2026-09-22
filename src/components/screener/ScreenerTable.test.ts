import { describe, expect, it } from "vitest";

import { type NumberColumn, columnGroups } from "./ScreenerTable";

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
});
