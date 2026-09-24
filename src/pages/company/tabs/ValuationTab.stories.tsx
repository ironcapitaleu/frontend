import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { ValuationTab } from "./ValuationTab";

const failingGateway = alwaysFailingCompanyGateway();
/** Fails every section but the valuation, which never answers. */
const pendingGateway: CompanyGateway = {
	...failingGateway,
	getValuation: () => new Promise(() => {}),
};

/**
 * A gateway whose operating income is a loss in the latest fiscal year, so
 * EV/EBIT fails its guard and has no figure now.
 */
const operatingLossGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () => {
		const { financials } = fakeCompanyReport;
		const { annual } = financials.income;
		const latest = annual.periods.length - 1;
		const lines = annual.lines.map((line) =>
			line.key !== "operatingIncome"
				? line
				: {
						...line,
						points: line.points.map((point, index) =>
							index === latest && point !== null
								? { ...point, value: -50_000_000 }
								: point,
						),
					},
		);
		return {
			...financials,
			income: { ...financials.income, annual: { ...annual, lines } },
		};
	},
};

/**
 * The Valuation tab for MRDN, from the fake gateway of the test fixtures
 * unless a story sets its own (DESIGN.md §8 "Valuation"). Card 3.1 draws each
 * ratio now on a bar of its own ten years and a bar of the sector quartiles.
 * Card 3.3 lists each ratio with its formula, its inputs and its figure now.
 * The sources index at the foot lists the filings behind the tab.
 */
const meta: Meta<typeof ValuationTab> = {
	title: "Pages/CompanyPage/ValuationTab",
	component: ValuationTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: alwaysFoundCompanyGateway() },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ValuationTab>;

/** The loaded tab. Its card titles follow DESIGN.md §8. */
export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [
			"3.1 Ratios Against Their Own Ten Years and the Sector",
			"3.3 How the Ratios Are Built",
		];

		const headings = await canvas.findAllByRole("heading", { level: 2 });
		const result = headings
			.map((heading) => heading.textContent)
			.filter((title) => /^\d+\.\d+ /.test(title ?? ""));

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: every filing in the sources index feeds card 3.1, and no line
 * names a card the tab does not draw. The claims of card 3.3 are a subset of
 * those of card 3.1, so every line names card 3.1.
 */
export const Sources: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			await canvas.findByRole("button", {
				name: "Where these numbers come from",
			}),
		);
		const feeds = await canvas.findAllByText(/^Feeds /);
		const drawn = [
			"Ratios Against Their Own Ten Years and the Sector",
			"How the Ratios Are Built",
		];

		const expectedResult = feeds.map(() => ({
			namesCard31: true,
			namesOnlyDrawnCards: true,
		}));

		const result = feeds.map((line) => {
			const cards = (line.textContent ?? "").replace(/^Feeds /, "").split(", ");
			return {
				namesCard31: cards.includes(drawn[0] as string),
				namesOnlyDrawnCards: cards.every((card) => drawn.includes(card)),
			};
		});

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: card 3.3 has one row for each ratio of card 3.1. */
export const RatiosBuilt: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const table = await canvas.findByRole("table", {
			name: "How the Ratios Are Built table",
		});

		const expectedResult = ["P/E", "P/FCF", "P/B", "EV/EBIT"];

		const result = within(table)
			.getAllByRole("rowheader")
			.map((header) => header.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: a ratio that fails its guard still shows each input with its
 * sources in card 3.3, and a dash now.
 */
export const FailedGuard: Story = {
	parameters: { companyGateway: operatingLossGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const table = await canvas.findByRole("table", {
			name: "How the Ratios Are Built table",
		});
		const row = within(table).getByRole("row", { name: /^EV\/EBIT/ });
		const cells = within(row).getAllByRole("cell");

		const expectedResult = { inputsWithSources: [true, true], now: "—" };

		const result = {
			inputsWithSources: within(cells[1] as HTMLElement)
				.queryAllByRole("listitem")
				.map((item) => within(item).queryByRole("button") !== null),
			now: cells[2]?.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * The loaded tab at a phone width. The range bars stack under each ratio
 * name, and the table of card 3.3 scrolls inside its card.
 */
export const LoadedOnPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findAllByRole("region");

		const expectedResult = true;

		const result =
			canvasElement.scrollWidth <= canvasElement.ownerDocument.body.clientWidth;

		await expect(result).toBe(expectedResult);
	},
};

/** The sections are still loading. */
export const Loading: Story = {
	parameters: { companyGateway: pendingGateway },
};

/** A section request did not complete. */
export const Failed: Story = {
	parameters: { companyGateway: failingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "The valuation figures did not load.";

		const result = await canvas.findByText(/did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};
