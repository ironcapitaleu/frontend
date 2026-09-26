import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { meridianMasthead } from "@/lib/company/sample/masthead";
import type { MastheadSection } from "@/lib/company/types";
import { CompanyMasthead } from "./CompanyMasthead";

/** The text of the `dd` that follows the visually hidden `dt` named `term`. */
function definitionOf(term: string): string | null {
	return screen.getByText(term, { selector: "dt" }).nextElementSibling
		?.textContent as string | null;
}

describe("CompanyMasthead", () => {
	it("should show the company name as the page heading when rendered", () => {
		render(<CompanyMasthead masthead={meridianMasthead} />);

		const expectedResult = "Meridian Semiconductor Corp.";

		const result = screen.getByRole("heading", { level: 1 }).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should list every listing and a count of the others when the company has three listings", () => {
		render(<CompanyMasthead masthead={meridianMasthead} />);

		const expectedResult = [
			"NASDAQ: MRDN",
			"XETRA: MRD",
			"BMV: MRDN",
			"+2 listings",
		];

		const result = screen
			.getAllByRole("listitem")
			.map((item) => item.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should count one other listing in the singular when the company has two listings", () => {
		const masthead: MastheadSection = {
			...meridianMasthead,
			listings: meridianMasthead.listings.slice(0, 2),
		};
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = "+1 listing";

		const result = screen.getAllByRole("listitem").at(-1)?.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show no count of other listings when the company has one listing", () => {
		const masthead: MastheadSection = {
			...meridianMasthead,
			listings: meridianMasthead.listings.slice(0, 1),
		};
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = ["NASDAQ: MRDN"];

		const result = screen
			.getAllByRole("listitem")
			.map((item) => item.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should show a dash instead of a list when the company has no listings", () => {
		const masthead: MastheadSection = { ...meridianMasthead, listings: [] };
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = { list: null, dashes: 1 };

		const result = {
			list: screen.queryByRole("list", { name: "Listings" }),
			dashes: screen.queryAllByText("—").length,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should name the sector, country, reporting currency and fiscal year end when rendered", () => {
		render(<CompanyMasthead masthead={meridianMasthead} />);

		const expectedResult =
			"Semiconductors · United States · Reports in USD · Fiscal year ends Last Sunday of January";

		const result = screen.getByText(/^Semiconductors/).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the price and its change over one month when both prices are present", () => {
		render(<CompanyMasthead masthead={meridianMasthead} />);

		const expectedResult = { price: "$210.60", change: "+4.1% 1M" };

		const result = {
			price: definitionOf("Price"),
			change: definitionOf("Change over one month"),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show a dash for the price and the change when the price is missing", () => {
		const masthead: MastheadSection = { ...meridianMasthead, price: null };
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = { price: "—", change: "—" };

		const result = {
			price: definitionOf("Price"),
			change: definitionOf("Change over one month"),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show a dash for the price and the change when the price is not a number", () => {
		const masthead: MastheadSection = {
			...meridianMasthead,
			price: meridianMasthead.price && {
				...meridianMasthead.price,
				value: Number.NaN,
			},
		};
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = { price: "—", change: "—" };

		const result = {
			price: definitionOf("Price"),
			change: definitionOf("Change over one month"),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show a dash for the price and the change when the price is infinite", () => {
		const masthead: MastheadSection = {
			...meridianMasthead,
			price: meridianMasthead.price && {
				...meridianMasthead.price,
				value: Number.POSITIVE_INFINITY,
			},
		};
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = { price: "—", change: "—" };

		const result = {
			price: definitionOf("Price"),
			change: definitionOf("Change over one month"),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should show a dash for the change when the price a month earlier is missing", () => {
		const masthead: MastheadSection = {
			...meridianMasthead,
			priceMonthEarlier: null,
		};
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = "—";

		const result = definitionOf("Change over one month");

		expect(result).toBe(expectedResult);
	});

	it("should place the price on the 52-week range when the low and the high are present", () => {
		render(<CompanyMasthead masthead={meridianMasthead} />);

		const expectedResult = "$210.60, between $142.30 and $238.90";

		const result = screen.getByRole("meter", { name: "52-week range" });

		expect(result).toHaveAttribute("aria-valuetext", expectedResult);
	});

	it("should read the 52-week range as no data when the 52-week low is missing", () => {
		const masthead: MastheadSection = { ...meridianMasthead, low52Weeks: null };
		render(<CompanyMasthead masthead={masthead} />);

		const expectedResult = "52-week range: no data";

		const result = screen.getByText(/^52-week range:/).textContent;

		expect(result).toBe(expectedResult);
	});
});
