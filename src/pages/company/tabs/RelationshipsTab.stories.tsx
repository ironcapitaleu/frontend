import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { expect, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { RelationshipsTab } from "./RelationshipsTab";

const found = alwaysFoundCompanyGateway();
const { relationships } = fakeCompanyReport;

/** A gateway whose largest fund filed no 13F a quarter earlier, so its change is missing. */
const newFundGateway: CompanyGateway = {
	...found,
	getRelationships: async () => ({
		...relationships,
		funds: relationships.funds.map((row, position) =>
			position === 0 ? { ...row, sharesQuarterEarlier: null } : row,
		),
	}),
};

/** A gateway whose section lists no insider, so card 5.2 shows its empty copy. */
const noInsidersGateway: CompanyGateway = {
	...found,
	getRelationships: async () => ({ ...relationships, insiders: [] }),
};

/** A gateway whose section lists no subsidiary and no stake, so cards 5.4 and 5.5 show their empty copy. */
const ownsNothingGateway: CompanyGateway = {
	...found,
	getRelationships: async () => ({
		...relationships,
		subsidiaries: [],
		stakes: [],
	}),
};

/** A gateway that never answers, so the tab stays in its loading state. */
const loadingGateway: CompanyGateway = {
	...found,
	getRelationships: () => new Promise(() => {}),
};

/**
 * The Relationships tab of the company page for MRDN, from the fake gateway
 * of the test fixtures unless a story sets its own. Card 5.1 lists the largest
 * funds from 13F filings. Card 5.2 lists the insiders from their latest Form 4,
 * and card 5.3 splits the shares between institutions, insiders and the
 * public. Card 5.4 lists the subsidiaries from Exhibit 21, and card 5.5 lists
 * the stakes from the company's own 13F. A stake links to its company page
 * only when that page exists. The sources index at the foot lists the filings behind the tab.
 */
const meta: Meta<typeof RelationshipsTab> = {
	title: "Pages/CompanyPage/RelationshipsTab",
	component: RelationshipsTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: found },
	decorators: [
		(Story, { parameters }) => (
			<MemoryRouter>
				<CompanyGatewayProvider gateway={parameters.companyGateway}>
					<Story />
				</CompanyGatewayProvider>
			</MemoryRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof RelationshipsTab>;

/** Play test: the numbered card titles follow DESIGN.md §8 "Relationships". */
export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [
			"5.1 Owned By: Largest Funds",
			"5.2 Owned By: Insiders",
			"5.3 Ownership Split",
			"5.4 Owns: Subsidiaries",
			"5.5 Owns: Stakes in Listed Companies",
		];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: at 320 px, the funds table scrolls inside its card and the page does not scroll sideways. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const [table] = await within(canvasElement).findAllByRole("table");
		const container = table.parentElement;

		const expectedResult = { scrollsInsideCard: true, pageScrolls: false };

		const result = {
			scrollsInsideCard:
				container !== null && container.scrollWidth > container.clientWidth,
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a fund with no 13F a quarter earlier shows its change as the dimmed dash. */
export const MissingChange: Story = {
	parameters: { companyGateway: newFundGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "—";

		const row = await canvas.findByRole("row", { name: /Harlow Index Trust/ });
		const result = row.lastElementChild?.textContent;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: with no insider, card 5.2 says so instead of drawing an empty table. */
export const NoInsiders: Story = {
	parameters: { companyGateway: noInsidersGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "No insider reports a holding.";

		const result = await within(canvasElement).findByText(/No insider/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: a stake whose company has a page links to `/companies/:symbol`. */
export const StakeWithPage: Story = {
	args: { hasCompanyPage: (ticker) => ticker.equals(Ticker.parse("CRVD")) },
	play: async ({ canvasElement }) => {
		const expectedResult = "/companies/CRVD";

		const link = await within(canvasElement).findByRole("link", {
			name: "Corvid Sensing",
		});
		const result = link.getAttribute("href");

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a stake whose company has no page shows its name as plain text, even with a known ticker. */
export const StakeWithoutPage: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = null;

		await canvas.findByRole("rowheader", { name: "Corvid Sensing" });
		const result = canvas.queryByRole("link", { name: "Corvid Sensing" });

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: with no subsidiary and no stake, cards 5.4 and 5.5 each say so instead of drawing an empty table. */
export const OwnsNothing: Story = {
	parameters: { companyGateway: ownsNothingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = { subsidiaries: true, stakes: true };

		const result = {
			subsidiaries: (await canvas.findByText(/lists no subsidiary/)) !== null,
			stakes: (await canvas.findByText(/lists no stake/)) !== null,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the tab shows a spinner while the section loads. */
export const Loading: Story = {
	parameters: { companyGateway: loadingGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "Loading relationships";

		const result = within(canvasElement).getByRole("status");

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/** Play test: the tab says so when the section fails to load. */
export const Failed: Story = {
	parameters: { companyGateway: alwaysFailingCompanyGateway() },
	play: async ({ canvasElement }) => {
		const expectedResult = "The relationships did not load.";

		const result = await within(canvasElement).findByText(/did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
