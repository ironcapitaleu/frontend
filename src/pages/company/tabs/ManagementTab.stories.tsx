import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { ManagementTab } from "./ManagementTab";

const found = alwaysFoundCompanyGateway();
const { management } = fakeCompanyReport;

/** A gateway whose first person has no start date, so their tenure is missing. */
const missingStartGateway: CompanyGateway = {
	...found,
	getManagement: async () => ({
		...management,
		people: management.people.map((row, position) =>
			position === 0 ? { ...row, since: null } : row,
		),
	}),
};

/** A gateway whose latest pay has no bonus, so no share of the pay mix exists. */
const missingBonusGateway: CompanyGateway = {
	...found,
	getManagement: async () => ({
		...management,
		ceoPay: management.ceoPay.map((year, position, years) =>
			position === years.length - 1 ? { ...year, bonus: null } : year,
		),
	}),
};

/** A gateway with no pay and no insider, so cards 6.3 and 6.4 show their empty copy. */
const noPayNoInsidersGateway: CompanyGateway = {
	...found,
	getManagement: async () => ({ ...management, ceoPay: [], insiders: [] }),
};

/** A gateway that never answers, so the tab stays in its loading state. */
const loadingGateway: CompanyGateway = {
	...found,
	getManagement: () => new Promise(() => {}),
};

/** A gateway whose section lists no person, so card 6.1 shows its empty copy. */
const noPeopleGateway: CompanyGateway = {
	...found,
	getManagement: async () => ({ ...management, people: [] }),
};

/**
 * The Management tab for MRDN, from the fake gateway unless a story sets its
 * own. Card 6.1 lists the executives and directors from the proxy statement,
 * and the sources index at the foot lists the filings behind the tab.
 */
const meta: Meta<typeof ManagementTab> = {
	title: "Pages/CompanyPage/ManagementTab",
	component: ManagementTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: found },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ManagementTab>;

/** Play test: the numbered card titles follow DESIGN.md §8 "Management". */
export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [
			"6.1 Executives and Board",
			"6.3 Pay Mix",
			"6.4 Insider Holdings",
		];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: at 320 px, the people table scrolls inside its card, cards 6.3 and 6.4 stack, and the page does not scroll sideways. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const [table] = await within(canvasElement).findAllByRole("table");
		const container = table.parentElement;

		const [payMix, holdings] = ["6.3", "6.4"].map((number) =>
			within(canvasElement)
				.getByRole("region", { name: new RegExp(`^${number}`) })
				.getBoundingClientRect(),
		);

		const expectedResult = {
			scrollsInsideCard: true,
			pageScrolls: false,
			cardsStack: true,
		};

		const result = {
			cardsStack:
				payMix.left === holdings.left && payMix.bottom <= holdings.top,
			scrollsInsideCard:
				container !== null && container.scrollWidth > container.clientWidth,
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a person with no start date shows their tenure as the dimmed dash. */
export const MissingTenure: Story = {
	parameters: { companyGateway: missingStartGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "—";

		const card = await within(canvasElement).findByRole("region", {
			name: /^6\.1/,
		});
		const row = within(card).getByRole("row", { name: /Dana Whitcombe/ });
		const result = row.children[2]?.textContent;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: with no person, card 6.1 says so instead of drawing an empty table. */
export const NoPeople: Story = {
	parameters: { companyGateway: noPeopleGateway },
	play: async ({ canvasElement }) => {
		const expectedResult =
			"The proxy statement lists no executive or director.";

		const result = await within(canvasElement).findByText(/lists no executive/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: a missing part of the latest pay leaves every share of the pay mix as the dimmed dash, never 0%. */
export const MissingPayPart: Story = {
	parameters: { companyGateway: missingBonusGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = ["—", "—", "—", "—"];

		const bar = await within(canvasElement).findByRole("figure", {
			name: "Pay mix",
		});
		const result = within(bar)
			.getAllByRole("listitem")
			.map((item) => item.lastElementChild?.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: with no pay and no insider, cards 6.3 and 6.4 each say so in one line. */
export const NoPayNoInsiders: Story = {
	parameters: { companyGateway: noPayNoInsidersGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [
			"The proxy statement reports no pay for the chief executive.",
			"No insider reports a holding.",
		];

		const result = [
			await canvas.findByText(/reports no pay/),
			canvas.getByText(/No insider reports/),
		].map((line) => line.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the tab shows a spinner while the section loads. */
export const Loading: Story = {
	parameters: { companyGateway: loadingGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "Loading management";

		const result = within(canvasElement).getByRole("status");

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/** Play test: the tab says so when the section fails to load. */
export const Failed: Story = {
	parameters: { companyGateway: alwaysFailingCompanyGateway() },
	play: async ({ canvasElement }) => {
		const expectedResult = "The management data did not load.";

		const result = await within(canvasElement).findByText(/did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
