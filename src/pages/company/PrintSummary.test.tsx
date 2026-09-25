import { describe, expect, it } from "vitest";

import { MISSING, MISSING_INK } from "../../components/screener/format";
import { completeSections } from "../../lib/company/metrics";
import type { CompletedSections } from "../../lib/company/types";
import { Ticker } from "../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../test/fixtures/companies/always-failing";
import {
	fakeCompanyReport,
	fakeMasthead,
} from "../../test/fixtures/companies/fake-company-report";
import { render, screen } from "../../test/render";
import {
	type PrintSections,
	PrintSummary,
	usePrintSections,
} from "./PrintSummary";

const ticker = Ticker.parse("MRDN");
const masthead = fakeMasthead(ticker);

/** Shows the status of the printed summary's sections. */
function StatusProbe() {
	return <output>{usePrintSections(ticker).status}</output>;
}

describe("usePrintSections", () => {
	it("should be failed when no section of the summary loads", async () => {
		render(<StatusProbe />, { companyGateway: alwaysFailingCompanyGateway() });

		const expectedResult = "failed";

		const result = await screen.findByText(expectedResult);

		expect(result).toHaveTextContent(expectedResult);
	});
});

describe("PrintSummary", () => {
	it("should say the figures did not load when the summary failed", () => {
		render(<PrintSummary masthead={masthead} summary={{ status: "failed" }} />);

		const expectedResult =
			"The figures of this summary did not load. Try again in a moment.";

		const result = screen.getByText(/did not load/);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should say the summary is still loading when a section is pending", () => {
		render(
			<PrintSummary masthead={masthead} summary={{ status: "loading" }} />,
		);

		const expectedResult = "The summary is still loading.";

		const result = screen.getByText(/still loading/);

		expect(result).toHaveTextContent(expectedResult);
	});
});

describe("PrintSummary regions 4 to 6", () => {
	const loaded = (sections: CompletedSections): PrintSections => ({
		status: "loaded",
		sections,
	});

	it("should show a dimmed dash for each shareholder return when shareholder returns have not loaded", () => {
		render(
			<PrintSummary
				masthead={masthead}
				summary={loaded(
					completeSections({ ...fakeCompanyReport, shareholderReturns: null }),
				)}
			/>,
		);

		const expectedResult = [
			{ text: MISSING, dimmed: true },
			{ text: MISSING, dimmed: true },
		];

		// The block of region 5 follows the area of the same name in "Checks by area".
		const block = screen
			.getAllByRole("region", { name: "Shareholder returns", hidden: true })
			.at(-1);
		const result = [...(block?.querySelectorAll("dd") ?? [])].map((value) => ({
			text: value.textContent,
			dimmed: value.querySelector(`span.${CSS.escape(MISSING_INK)}`) !== null,
		}));

		expect(result).toEqual(expectedResult);
	});

	it("should name the filings by form in the sources footer when the summary is loaded", () => {
		render(
			<PrintSummary
				masthead={masthead}
				summary={loaded(completeSections(fakeCompanyReport))}
			/>,
		);

		const expectedResult =
			"Filings: 10-K for FY2016 to FY2025 (10 filings) · 8-K for 12 Feb 2026, Quillvane Instruments, Inc. · 13F-HR for Q3 2025, Quillvane Instruments, Inc. · 10-Q for Q1 FY2025 to Q3 FY2025 (3 filings)";

		const result = screen.getByText(/^Filings:/);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should give the sample-data notice and the date generated in the sources footer when the summary is loaded", () => {
		render(
			<PrintSummary
				masthead={masthead}
				summary={loaded(completeSections(fakeCompanyReport))}
				generatedOn={new Date(2026, 2, 12, 12, 0)}
			/>,
		);

		const expectedResult =
			"Sample data. The company and its figures are made up. Generated on 12 Mar 2026.";

		const result = screen.getByText(/^Sample data\./);

		expect(result).toHaveTextContent(expectedResult);
	});
});
