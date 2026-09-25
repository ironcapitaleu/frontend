import { describe, expect, it } from "vitest";

import { MISSING } from "@/components/screener/format";
import type { Claim } from "@/lib/company/types";
import { fakeCompanyReport } from "@/test/fixtures/companies/fake-company-report";
import { render, screen } from "@/test/render";
import { FigureCell } from "./FigureCell";

const claim =
	fakeCompanyReport.financials.balance.quarterly.lines[0]?.points.at(
		-1,
	) as Claim;

describe("FigureCell", () => {
	it("should print the dimmed dash when the value is not a finite number", () => {
		render(
			<table>
				<tbody>
					<tr>
						<FigureCell
							figure={{ ...claim, value: Number.NaN }}
							format={String}
						/>
					</tr>
				</tbody>
			</table>,
		);

		const expectedResult = MISSING;

		const result = screen.getByRole("cell").textContent;

		expect(result).toBe(expectedResult);
	});
});
