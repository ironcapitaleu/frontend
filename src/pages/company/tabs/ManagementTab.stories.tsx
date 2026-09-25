import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { Ticker } from "../../../lib/domain/ticker";
import {
	BAR_TARGETS_OK,
	barTargetsOf,
	unreachableBarsOf,
} from "../../../test/barTargets";
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

/** A gateway with a salary that is not a number, a missing bonus, and a year of no pay whose year is not a whole number. */
const oddPayGateway: CompanyGateway = {
	...found,
	getManagement: async () => {
		const [first, latest] = management.ceoPay;
		const salary = first?.salary && { ...first.salary, value: Number.NaN };
		const none = { salary: null, bonus: null, stockAwards: null, other: null };
		const ceoPay = [
			{ ...first, salary },
			{ ...latest, bonus: null },
		];
		return {
			...management,
			ceoPay: [...ceoPay, { fiscalYear: 2025.5, ...none }],
		};
	},
};

/** A series with no year. */
const NO_YEARS = { periods: [], points: [] };

/** A gateway with no pay, no insider and no trade, so cards 6.2 to 6.5 show their empty copy. */
const noPayNoInsidersGateway: CompanyGateway = {
	...found,
	getManagement: async () => ({
		...management,
		ceoPay: [],
		insiders: [],
		insiderSharesBought: { ...management.insiderSharesBought, ...NO_YEARS },
		insiderSharesSold: { ...management.insiderSharesSold, ...NO_YEARS },
	}),
};

/** Returns a gateway whose latest pay sets each part in `changes` to its value in USD. */
function latestPayGateway(
	changes: Partial<
		Record<"salary" | "bonus" | "stockAwards" | "other", number>
	>,
): CompanyGateway {
	return {
		...found,
		getManagement: async () => ({
			...management,
			ceoPay: management.ceoPay.map((year, position, years) => {
				if (position !== years.length - 1) return year;
				const changed = { ...year };
				for (const [key, value] of Object.entries(changes)) {
					const part = key as keyof typeof changes;
					const claim = year[part];
					changed[part] = claim && { ...claim, value };
				}
				return changed;
			}),
		}),
	};
}

/** Returns a gateway whose insiders bought `bought` shares in FY2024 and FY2025 and sold 400,000 and 250,000. `null` is a year with no Form 4. */
function tradesGateway(bought: (number | null)[]): CompanyGateway {
	const series = management.insiderSharesBought;
	const points = series.points.map((point, position) => {
		const value = bought[position];
		return value === null || point === null ? null : { ...point, value };
	});
	return {
		...found,
		getManagement: async () => ({
			...management,
			insiderSharesBought: { ...series, points },
		}),
	};
}

/** Finds the plot of card 6.5. */
async function tradesPlotOf(canvasElement: HTMLElement) {
	const card = await within(canvasElement).findByRole("region", {
		name: /^6\.5/,
	});
	return within(card).findByRole("list", { name: "Fiscal years" });
}

/** Tells, for each bar of `plot`, whether it sits above the zero line. */
function barsAboveZero(plot: HTMLElement): boolean[] {
	const zero = plot.nextElementSibling?.getBoundingClientRect().top ?? 0;
	return within(plot)
		.getAllByRole("button")
		.map((bar) => bar.getBoundingClientRect().bottom <= zero + 0.5);
}

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
			"6.2 CEO Pay by Year",
			"6.3 Pay Mix",
			"6.4 Insider Holdings",
			"6.5 Insider Buying and Selling by Year",
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

/** Play test: with no pay and no insider, cards 6.2, 6.3 and 6.4 each say so in one line. */
export const NoPayNoInsiders: Story = {
	parameters: { companyGateway: noPayNoInsidersGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = [
			"The proxy statement reports no pay for the chief executive.",
			"The proxy statement reports no pay for the chief executive.",
			"No insider reports a holding.",
		];

		const result = [
			...(await canvas.findAllByText(/reports no pay/)),
			canvas.getByText(/No insider reports/),
		].map((line) => line.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: at 320 px, card 6.2 draws no part for a missing or odd figure and leaves a gap for a year with no pay. Each part is a target at least 24 × 24 px inside the plot, the page does not scroll sideways, and the "Data" table shows each gap as the dash. */
export const PayMissingParts: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	parameters: { companyGateway: oddPayGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const [plot] = await canvas.findAllByRole("list", { name: "Fiscal years" });
		const parts = within(plot)
			.getAllByRole("listitem")
			.map((year) => within(year).queryAllByRole("button").length);
		const targets = barTargetsOf(plot);
		await userEvent.click(canvas.getAllByRole("button", { name: "Data" })[0]);

		const expectedResult = {
			parts: [3, 3, 0],
			targets: BAR_TARGETS_OK,
			rows: [
				["FY2024", "—", "1,200", "6,500", "200"],
				["FY2025", "1,000", "—", "7,200", "250"],
				["—", "—", "—", "—", "—"],
			],
		};

		const table = canvas.getByRole("table", { name: "CEO pay by year" });
		const rows = within(table)
			.getAllByRole("row")
			.slice(1)
			.map((row) => [...row.children].map((cell) => cell.textContent));
		const result = { parts, targets, rows };

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: at 320 px, a tiny bonus and a tiny other part sit beside the large parts. Each part is as tall as its value, yet each trigger is at least 24 × 24 px, stays inside the plot, and keeps a strip that a pointer reaches. */
export const PayTinyParts: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	parameters: {
		companyGateway: latestPayGateway({ bonus: 5_000, other: 1_000 }),
	},
	play: async ({ canvasElement }) => {
		const [plot] = await within(canvasElement).findAllByRole("list", {
			name: "Fiscal years",
		});
		const [salary, bonus] = within(plot)
			.getAllByRole("button")
			.slice(4)
			.map((bar) => bar.parentElement?.getBoundingClientRect().height ?? 0);

		const expectedResult = {
			targets: BAR_TARGETS_OK,
			unreachable: [],
			proportional: true,
		};

		const result = {
			targets: barTargetsOf(plot),
			unreachable: unreachableBarsOf(plot),
			proportional: Math.abs((bonus ?? 0) / (salary ?? 1) - 5 / 1000) < 0.01,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: a negative part draws below the zero line, which rises off the
 * foot of the plot, so the figure still opens its sources, and every trigger
 * stays inside the plot.
 */
export const PayNegativePart: Story = {
	parameters: { companyGateway: latestPayGateway({ stockAwards: -500_000 }) },
	play: async ({ canvasElement }) => {
		const [plot] = await within(canvasElement).findAllByRole("list", {
			name: "Fiscal years",
		});
		const zeroLine = plot.nextElementSibling?.getBoundingClientRect();

		const expectedResult = {
			parts: [4, 4],
			zeroLineAboveFoot: true,
			targets: BAR_TARGETS_OK,
		};

		const result = {
			parts: within(plot)
				.getAllByRole("listitem")
				.map((year) => within(year).queryAllByRole("button").length),
			zeroLineAboveFoot:
				plot.getBoundingClientRect().bottom - (zeroLine?.top ?? 0) >= 1,
			targets: barTargetsOf(plot),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: with no pay and no trade, cards 6.2 and 6.5 offer no "Data" button, since there is no table to show. */
export const NoPayActions: Story = {
	parameters: { companyGateway: noPayNoInsidersGateway },
	play: async ({ canvasElement }) => {
		const expectedResult: string[] = [];

		const cards = await within(canvasElement).findAllByRole("region", {
			name: /^6\.[25]/,
		});
		const result = cards.flatMap((card) =>
			within(card)
				.queryAllByRole("button")
				.map((button) => button.textContent),
		);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: each part of the pay has the same name and the same fill in card 6.2 and card 6.3. */
export const PayPartsAgree: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const [legend] = await canvas.findAllByRole("list", { name: "Legend" });
		const mix = canvas.getByRole("figure", { name: "Pay mix" });
		const partsOf = (items: HTMLElement[]) =>
			items.map((item) => ({
				label: item.textContent?.replace(/\d.*$/, "").replace("—", ""),
				fill: [...(item.firstElementChild?.classList ?? [])].find((name) =>
					name.startsWith("bg-chart-"),
				),
			}));

		const expectedResult = partsOf(within(legend).getAllByRole("listitem"));

		const result = partsOf(within(mix).getAllByRole("listitem"));

		await expect(result).toEqual(expectedResult);
	},
};

/** Cards 6.2 and 6.5 in the dark theme. The four parts of pay take `chart-1` to `chart-4` of the dark ramp, and the insider bars take `chart-1`, each at 3:1 on the card. */
export const PayDark: Story = {
	globals: { theme: "dark" },
};

/** Play test: at 320 px, insiders who sell more than they buy draw each year of card 6.5 below the zero line. Every bar is a target at least 24 × 24 px inside the plot that a pointer reaches, and the page does not scroll sideways. */
export const NetSellingPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const plot = await tradesPlotOf(canvasElement);

		const expectedResult = {
			above: [false, false],
			targets: BAR_TARGETS_OK,
			unreachable: [],
		};

		const result = {
			above: barsAboveZero(plot),
			targets: barTargetsOf(plot),
			unreachable: unreachableBarsOf(plot),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a year with no Form 4 draws the dimmed dash and no bar, and net buying draws above the zero line. */
export const MissingTradeYear: Story = {
	parameters: { companyGateway: tradesGateway([null, 450_000]) },
	play: async ({ canvasElement }) => {
		const plot = await tradesPlotOf(canvasElement);

		const expectedResult = { missing: "FY2024—", above: [true] };

		const result = {
			missing: within(plot).getAllByRole("listitem")[0]?.textContent,
			above: barsAboveZero(plot),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a year whose buys and sells cancel draws a 2 px mark, and its trigger is still at least 24 × 24 px inside the plot. */
export const ZeroTradeYear: Story = {
	parameters: { companyGateway: tradesGateway([400_000, 60_000]) },
	play: async ({ canvasElement }) => {
		const plot = await tradesPlotOf(canvasElement);
		const [zero] = within(plot).getAllByRole("button");

		const expectedResult = { mark: 2, targets: BAR_TARGETS_OK };

		const result = {
			mark: zero?.parentElement?.getBoundingClientRect().height,
			targets: barTargetsOf(plot),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: "Data" swaps card 6.5 for a table of whole shares, so a net sale of 400 shares reads −400, not 0, and a figure that is not a number shows the dash, never NaN. */
export const TradesData: Story = {
	parameters: { companyGateway: tradesGateway([Number.NaN, 249_600]) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await tradesPlotOf(canvasElement);
		await userEvent.click(canvas.getAllByRole("button", { name: "Data" })[1]);

		const expectedResult = [
			["FY2024", "—"],
			["FY2025", "−400"],
		];

		const table = canvas.getByRole("table", { name: /^Insider buying/ });
		const result = within(table)
			.getAllByRole("row")
			.slice(1)
			.map((row) => [...row.children].map((cell) => cell.textContent));

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: when no year has both a buy and a sell figure, card 6.5 says so
 * and draws no chart and no "Data" button.
 */
export const NoNetYear: Story = {
	parameters: { companyGateway: tradesGateway([null, null]) },
	play: async ({ canvasElement }) => {
		const card = await within(canvasElement).findByRole("region", {
			name: /^6\.5/,
		});

		const expectedResult = {
			line: "No year has both a buy and a sell figure, so no net can be drawn.",
			plots: 0,
			data: 0,
		};

		const result = {
			line: within(card).getByText(/no net/).textContent,
			plots: within(card).queryAllByRole("list", { name: "Fiscal years" })
				.length,
			data: within(card).queryAllByRole("button", { name: "Data" }).length,
		};

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
