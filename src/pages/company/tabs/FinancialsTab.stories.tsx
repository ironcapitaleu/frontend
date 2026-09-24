import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { MISSING, MISSING_INK } from "@/components/screener/format";
import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../../test/fixtures/companies/always-found";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import { sampleCompanyGateway } from "../../../lib/company/sampleCompanyGateway";
import { FinancialsTab } from "./FinancialsTab";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const phone = { viewport: { value: "mobile1", isRotated: false } };

const pending = (): Promise<never> => new Promise(() => {});
const sampleGateway = sampleCompanyGateway();

/** A gateway whose Financials section never answers, so the tab stays loading. */
const neverAnsweringGateway: CompanyGateway = {
	getMasthead: pending,
	getOverview: pending,
	getFinancials: pending,
	getValuation: pending,
	getShareholderReturns: pending,
	getRelationships: pending,
	getManagement: pending,
	getFilings: pending,
};

/**
 * A gateway whose income statement lacks its annual table. The test fixture
 * leaves each fourth quarter empty, and without the fiscal year the page
 * cannot derive it, so each fourth quarter stays missing.
 */
const missingFourthQuartersGateway: CompanyGateway = {
	...alwaysFoundCompanyGateway(),
	getFinancials: async () => {
		const { financials } = fakeCompanyReport;
		return {
			...financials,
			income: { ...financials.income, annual: { periods: [], lines: [] } },
		};
	},
};

/**
 * The Financials tab for Meridian Semiconductor (MRDN), from the sample
 * gateway. The control row picks the statement, the annual or quarterly view
 * and the unit. The statement table card shows the chosen table, and every
 * cell opens the sources of its figure.
 */
const meta: Meta<typeof FinancialsTab> = {
	title: "Pages/CompanyPage/FinancialsTab",
	component: FinancialsTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { companyGateway: undefined },
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof FinancialsTab>;

/**
 * Play test: the card titles follow the statement switch. The chart is card
 * 2.1 and the statement table card 2.2 (DESIGN.md §8).
 */
export const Default: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const title = async () =>
			(await canvas.findAllByRole("heading", { name: /^2\.\d / }))
				.map(({ textContent }) => textContent)
				.join(", ");

		const expectedResult = [
			"2.1 Income Statement Chart, 2.2 Income Statement",
			"2.1 Balance Sheet Chart, 2.2 Balance Sheet",
			"2.1 Cash Flow Chart, 2.2 Cash Flow",
		];

		const result = [await title()];
		await userEvent.click(
			canvas.getByRole("button", { name: "Balance sheet" }),
		);
		result.push(await title());
		await userEvent.click(canvas.getByRole("button", { name: "Cash flow" }));
		result.push(await title());

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the quarterly view shows eight quarter columns, newest last. */
export const Quarterly: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			await canvas.findByRole("button", { name: "Quarterly" }),
		);

		const expectedResult = 8;

		const result = canvas
			.getAllByRole("columnheader")
			.filter((header) =>
				/^Q\d FY\d{4}$/.test(header.textContent ?? ""),
			).length;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a click on a figure pins its source card. */
export const FigureSources: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const line = await canvas.findByRole("rowheader", { name: "Revenue" });
		const figure = within(line.closest("tr") as HTMLElement).getAllByRole(
			"button",
		)[0];

		const expectedResult = "Sources of Revenue";

		await userEvent.click(figure);
		const result = await within(canvasElement.ownerDocument.body).findByRole(
			"dialog",
		);

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/**
 * Play test: at 390 px the page does not scroll sideways. The table scrolls
 * inside its card, and the line names stay fixed at its left edge.
 */
export const Phone: Story = {
	globals: phone,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const line = await canvas.findByRole("rowheader", { name: "Revenue" });
		const scroller = line.closest("[data-slot=table-container]") as HTMLElement;
		const left = line.getBoundingClientRect().left;
		scroller.scrollLeft = scroller.scrollWidth;
		await new Promise(requestAnimationFrame);

		const expectedResult = {
			pageScrolls: false,
			tableScrolls: true,
			fixed: left,
		};

		const result = {
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
			tableScrolls: scroller.scrollLeft > 0,
			fixed: line.getBoundingClientRect().left,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: at 1024 px and wider the line names have no ink of their own, so
 * the row hover reaches the first column.
 */
export const WideFirstColumn: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const line = await canvas.findByRole("rowheader", { name: "Revenue" });

		const expectedResult = "rgba(0, 0, 0, 0)";

		const result = getComputedStyle(line).backgroundColor;

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: a quarter the filings do not give shows the dimmed dash and
 * opens no sources.
 */
export const MissingFigure: Story = {
	globals: desktop,
	parameters: { companyGateway: missingFourthQuartersGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			await canvas.findByRole("button", { name: "Quarterly" }),
		);
		const row = (
			await canvas.findByRole("rowheader", { name: "Revenue" })
		).closest("tr") as HTMLElement;

		const expectedResult = { dimmedDashes: 2, figures: 6 };

		const result = {
			dimmedDashes: within(row)
				.getAllByRole("cell")
				.filter(
					(cell) =>
						cell.textContent === MISSING &&
						cell.querySelector(`[class="${MISSING_INK}"]`) !== null,
				).length,
			figures: within(row).getAllByRole("button").length,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: with no annual table, the chart card says so in one line
 * instead of drawing an empty plot (DESIGN.md §8).
 */
export const EmptyChart: Story = {
	globals: desktop,
	parameters: { companyGateway: missingFourthQuartersGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "No fiscal years to chart.";

		const result = await canvas.findByText(expectedResult);

		await expect(result).toBeVisible();
	},
};

/**
 * Opens the chart of `statement` and checks every bar: its trigger is at
 * least 24 px wide and tall and inside the plot, the bar draws, and the page
 * does not scroll sideways.
 */
async function checkBarTargets(
	canvasElement: HTMLElement,
	statement = "Cash flow",
) {
	const canvas = within(canvasElement);
	const body = within(canvasElement.ownerDocument.body);
	await userEvent.click(
		await canvas.findByRole("combobox", { name: "Statement" }),
	);
	await userEvent.click(await body.findByRole("option", { name: statement }));
	const plot = await canvas.findByRole("list", { name: "Fiscal years" });
	const bars = within(plot).getAllByRole("button");
	const page = canvasElement.ownerDocument.documentElement;
	const { top, bottom } = plot.getBoundingClientRect();

	const expectedResult = {
		smallTargets: [],
		targetsOutsidePlot: [],
		invisibleBars: [],
		pageScrollsSideways: false,
	};

	const result = {
		smallTargets: bars.filter((bar) => {
			const { width, height } = bar.getBoundingClientRect();
			return width < 24 || height < 24;
		}),
		targetsOutsidePlot: bars.filter((bar) => {
			const rect = bar.getBoundingClientRect();
			return rect.top < top - 0.5 || rect.bottom > bottom + 0.5;
		}),
		invisibleBars: bars.filter(
			(bar) => bar.parentElement?.getBoundingClientRect().height === 0,
		),
		pageScrollsSideways: page.scrollWidth > page.clientWidth,
	};

	await expect(result).toEqual(expectedResult);
}

/**
 * Play test: every bar of the cash flow chart can be tapped on a phone. Each
 * bar's trigger is at least 24 px wide and 24 px tall, even when the bar is
 * drawn smaller, and it stays inside the plot. Every bar draws, including the
 * years that report zero share repurchases. The chart scrolls inside its
 * card, so the page does not scroll sideways.
 */
export const BarTargets: Story = {
	globals: phone,
	play: ({ canvasElement }) => checkBarTargets(canvasElement),
};

/**
 * Play test: every bar of the income chart can be tapped on a phone,
 * including the free cash flow bars, the third line of the chart.
 */
export const IncomeBarTargets: Story = {
	globals: phone,
	play: ({ canvasElement }) =>
		checkBarTargets(canvasElement, "Income statement"),
};

/**
 * A gateway whose cash flow statement reports capital expenditure as a small
 * negative number, so the zero line sits near the foot of the chart.
 */
const negativeCapexGateway: CompanyGateway = {
	...sampleGateway,
	getFinancials: async () => {
		const financials = await sampleGateway.getFinancials(Ticker.parse("MRDN"));
		const { annual } = financials.cashFlow;
		const lines = annual.lines.map((line) =>
			line.key === "capitalExpenditure"
				? {
						...line,
						points: line.points.map((point) =>
							point !== null && typeof point.value === "number"
								? { ...point, value: -point.value / 20 }
								: point,
						),
					}
				: line,
		);
		return {
			...financials,
			cashFlow: { ...financials.cashFlow, annual: { ...annual, lines } },
		};
	},
};

/**
 * Play test: with a small negative capital expenditure the zero line sits
 * near the foot of the plot, so a capex bar has less than 24 px below it.
 * Its trigger grows up across the zero line and stays inside the plot.
 */
export const BarTargetsNearTheEdge: Story = {
	globals: phone,
	parameters: { companyGateway: negativeCapexGateway },
	play: ({ canvasElement }) => checkBarTargets(canvasElement),
};

/**
 * The chart in the dark theme. Each line's fill comes from the dark chart
 * ramp and reaches 3:1 on the dark card, so the three lines read apart.
 */
export const ChartDark: Story = {
	globals: { ...desktop, theme: "dark" },
};

/**
 * Play test: a click on a bar pins its sources, and the "Data" button swaps
 * the chart for a table of the same figures.
 */
export const ChartSourcesAndData: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		const expectedResult = { sources: "Sources of Revenue", table: true };

		const bars = await canvas.findAllByRole("button", { name: /^Revenue: / });
		await userEvent.click(bars[0] as HTMLElement);
		const sources = (await body.findByRole("dialog")).getAttribute(
			"aria-label",
		);
		await userEvent.keyboard("{Escape}");
		await userEvent.click(canvas.getByRole("button", { name: "Data" }));
		const result = {
			sources,
			table:
				canvas.queryByRole("table", {
					name: "Income statement chart table",
				}) !== null,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the Sources index names the statement tables and the charts. */
export const SourcesNameCharts: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			await canvas.findByRole("button", {
				name: "Where these numbers come from",
			}),
		);
		const feeds = (await canvas.findAllByText(/^Feeds /))
			.map((line) => line.textContent)
			.join(" ");

		const expectedResult = { namesTable: true, namesChart: true };

		const result = {
			namesTable: feeds.includes("Income statement table"),
			namesChart: feeds.includes("Income statement chart"),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: at 390 px the statement and period switches are select menus,
 * and picking a statement from the menu changes the card.
 */
export const PhoneMenus: Story = {
	globals: phone,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		const statement = await canvas.findByRole("combobox", {
			name: "Statement",
		});

		const expectedResult = {
			periodMenu: true,
			toggles: false,
			title: "2.2 Balance Sheet",
		};

		await userEvent.click(statement);
		await userEvent.click(
			await body.findByRole("option", { name: "Balance sheet" }),
		);
		const result = {
			periodMenu: canvas.queryByRole("combobox", { name: "Period" }) !== null,
			toggles: canvas.queryByRole("button", { name: "Quarterly" }) !== null,
			title: (await canvas.findByRole("heading", { name: /^2\.2 Balance/ }))
				.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: at 390 px the table shows the newest fiscal year first, and the
 * caption still names the periods oldest to newest.
 */
export const PhoneNewestFirst: Story = {
	globals: phone,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByRole("rowheader", { name: "Revenue" });

		const expectedResult = {
			columns: ["FY2026", "FY2025"],
			caption: true,
		};

		const result = {
			columns: canvas
				.getAllByRole("columnheader")
				.slice(1, 3)
				.map((header) => header.textContent),
			caption: canvas.queryAllByText(/^FY2017–FY2026 · /).length === 2,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Returns the cells of the row of `line` in the table of `statement`. */
async function cellsOf(
	canvasElement: HTMLElement,
	line: string,
	statement = "Income statement",
) {
	const canvas = within(canvasElement);
	const table = await canvas.findByRole("table", {
		name: `${statement} table`,
	});
	const row = within(table).getByRole("rowheader", { name: line });
	return within(row.closest("tr") as HTMLElement).getAllByRole("cell");
}

/**
 * Play test: the last column of the annual table is the growth per year
 * over ten years (CAGR), and a click on it opens the sources of the growth
 * rate.
 */
export const GrowthColumn: Story = {
	globals: desktop,
	play: async ({ canvasElement }) => {
		const cells = await cellsOf(canvasElement, "Revenue");
		const growth = within(cells.at(-1) as HTMLElement).getByRole("button");

		const expectedResult = "Sources of Revenue growth per year";

		await userEvent.click(growth);
		const result = await within(canvasElement.ownerDocument.body).findByRole(
			"dialog",
		);

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/**
 * Play test: a growth rate needs figures above zero in two years. The capital
 * expenditure of this gateway is negative, so its CAGR cell shows the dimmed
 * dash.
 */
export const MissingGrowth: Story = {
	globals: desktop,
	parameters: { companyGateway: negativeCapexGateway },
	play: async ({ canvasElement }) => {
		const statement = "Cash flow";
		await userEvent.click(
			await within(canvasElement).findByRole("button", { name: statement }),
		);
		const cells = await cellsOf(
			canvasElement,
			"Capital expenditure",
			statement,
		);
		const cell = cells.at(-1);

		const expectedResult = MISSING_INK;

		const result = cell?.querySelector("span")?.className;

		await expect(result).toBe(expectedResult);
	},
};

/** The Financials section is still loading. */
export const Loading: Story = {
	parameters: { companyGateway: neverAnsweringGateway },
};

/** Play test: a failed load says so in a heading, as the page does. */
export const Failed: Story = {
	parameters: { companyGateway: alwaysFailingCompanyGateway() },
	play: async ({ canvasElement }) => {
		const expectedResult = "The financial statements did not load.";

		const result = await within(canvasElement).findByRole("heading", {
			name: expectedResult,
		});

		await expect(result).toHaveTextContent(expectedResult);
	},
};
