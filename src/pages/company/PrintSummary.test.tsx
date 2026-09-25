import { describe, expect, it } from "vitest";

import { Ticker } from "../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../test/fixtures/companies/always-failing";
import { fakeMasthead } from "../../test/fixtures/companies/fake-company-report";
import { render, screen } from "../../test/render";
import { PrintSummary, usePrintSections } from "./PrintSummary";

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
