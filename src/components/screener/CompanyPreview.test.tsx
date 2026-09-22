import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
	EMPTY_FILTERS,
	describeActiveFilters,
} from "@/pages/public/StockScreener.logic";
import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";
import { render, screen } from "@/test/render";

import {
	CompanyPreview,
	describeRangePosition,
	matchValue,
} from "./CompanyPreview";

const [alfa] = fakeStockScreenerResults;

describe("matchValue", () => {
	it("should pair each active filter with the stock's own value when several are set", () => {
		const reasons = describeActiveFilters({
			...EMPTY_FILTERS,
			country: "US",
			peMax: "25",
			dividendYieldMin: "0.5",
			downLastMonth: "2",
			nearFiftyTwoWeekLow: true,
		});

		const expectedResult = ["US", "20.0", "1.0%", "−5.0%", "Yes"];

		const result = reasons.map((reason) => matchValue(alfa, reason));

		expect(result).toEqual(expectedResult);
	});
});

describe("describeRangePosition", () => {
	it("should state the distance above the low when the price is above it", () => {
		const expectedResult = "Trading 11% above its 52-week low.";

		const result = describeRangePosition(alfa);

		expect(result).toBe(expectedResult);
	});

	it("should say the price is at the low when it is not above it", () => {
		const expectedResult = "Trading at its 52-week low.";

		const result = describeRangePosition({ ...alfa, price: 90 });

		expect(result).toBe(expectedResult);
	});
});

describe("CompanyPreview", () => {
	it("should list the stock's value for each active filter when it opens", () => {
		render(
			<CompanyPreview
				stock={alfa}
				filters={{ ...EMPTY_FILTERS, peMax: "25" }}
				open
				onOpenChange={() => {}}
			/>,
		);

		const expectedResult = "P/E20.0≤ 25";

		const result = screen.getByRole("listitem").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should ask to close when the reader presses the close button", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(
			<CompanyPreview
				stock={alfa}
				filters={EMPTY_FILTERS}
				open
				onOpenChange={onOpenChange}
			/>,
		);

		const expectedResult = false;

		await user.click(screen.getByRole("button", { name: "Close" }));
		const result = onOpenChange.mock.lastCall?.[0];

		expect(result).toBe(expectedResult);
	});

	it("should render nothing when no stock is given", () => {
		const { container } = render(
			<CompanyPreview
				stock={null}
				filters={EMPTY_FILTERS}
				open
				onOpenChange={() => {}}
			/>,
		);

		const expectedResult = "";

		const result = container.innerHTML;

		expect(result).toBe(expectedResult);
	});
});
