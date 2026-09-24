import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Claim, FigureGroup, Filing, IsoDate } from "@/lib/company/types";
import { SourcesIndex } from "./SourcesIndex";

function filing(form: Filing["form"], number: string, filedOn: string): Filing {
	return {
		kind: "filing",
		form,
		filer: "Test Corp",
		accessionNumber: `0001999999-26-00000${number}`,
		filedOn: filedOn as IsoDate,
		periodLabel: form === "10-K" ? "FY2025" : "Q1 FY2026",
		indexUrl: `https://www.sec.gov/test/${number}`,
	};
}

function reported(id: string, document: Filing): Claim {
	return {
		id,
		label: id,
		value: 1,
		unit: "usd",
		period: null,
		source: {
			kind: "reported",
			document,
			line: "Revenue",
			xbrlTag: null,
			url: document.indexUrl,
		},
	};
}

const annual = reported("test.annual", filing("10-K", "1", "2026-02-20"));
const quarterly = reported("test.quarterly", filing("10-Q", "2", "2026-05-08"));
const peer = reported("test.peer", filing("10-K", "3", "2026-03-01"));
const printedOnly = reported("test.printed", filing("10-Q", "4", "2026-08-07"));

/** Two company groups and one sector group, whose peer filing the index skips. */
const groups: FigureGroup[] = [
	{
		ref: {
			tab: "overview",
			block: "tenYears",
			label: "Ten Years at a Glance",
			figures: "company",
		},
		claims: [annual, quarterly],
	},
	{
		ref: {
			tab: "overview",
			block: "financialPosition",
			label: "Financial Position",
			figures: "company",
		},
		claims: [quarterly],
	},
	{
		ref: {
			tab: "overview",
			block: "keyFigures",
			label: "Key Figures",
			figures: "sector",
		},
		claims: [peer],
	},
];

/** Renders the index and opens it. */
async function renderOpen() {
	render(<SourcesIndex groups={groups} />);
	await userEvent.click(
		screen.getByRole("button", { name: /Where these numbers come from/ }),
	);
	return screen.getAllByRole("listitem");
}

describe("SourcesIndex", () => {
	it("should be collapsed when it first renders", () => {
		render(<SourcesIndex groups={groups} />);

		const expectedResult = "false";

		const result = screen.getByRole("button", {
			name: /Where these numbers come from/,
		});

		expect(result).toHaveAttribute("aria-expanded", expectedResult);
	});

	it("should list each company filing newest first with its date and link when it is opened", async () => {
		const items = await renderOpen();

		const expectedResult = [
			{
				filing: "10-Q for Q1 FY2026, Test Corp",
				filed: "Filed 8 May 2026",
				link: "https://www.sec.gov/test/2",
			},
			{
				filing: "10-K for FY2025, Test Corp",
				filed: "Filed 20 Feb 2026",
				link: "https://www.sec.gov/test/1",
			},
		];

		const result = items.map((item) => ({
			filing: item.children[0].textContent,
			filed: item.children[1].textContent,
			link: within(item).getByRole("link").getAttribute("href"),
		}));

		expect(result).toEqual(expectedResult);
	});

	it("should name the figures each filing feeds when it is opened", async () => {
		const items = await renderOpen();

		const expectedResult = [
			"Feeds Ten Years at a Glance, Financial Position",
			"Feeds Ten Years at a Glance",
		];

		const result = items.map((item) => item.children[2].textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should name no filing and no figures of the printed page when a group is printed only", async () => {
		render(
			<SourcesIndex
				groups={[
					...groups,
					{
						ref: {
							tab: "overview",
							block: "printedShareholderReturns",
							label: "Shareholder returns, printed page",
							figures: "company",
						},
						claims: [printedOnly],
					},
				]}
			/>,
		);
		await userEvent.click(
			screen.getByRole("button", { name: /Where these numbers come from/ }),
		);

		const expectedResult = [
			"Feeds Ten Years at a Glance, Financial Position",
			"Feeds Ten Years at a Glance",
		];

		const result = screen
			.getAllByRole("listitem")
			.map((item) => item.children[2]?.textContent);

		expect(result).toEqual(expectedResult);
	});
});
