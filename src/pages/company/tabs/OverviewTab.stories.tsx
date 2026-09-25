import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";
import { MemoryRouter } from "react-router";

import { MISSING, MISSING_INK } from "../../../components/screener/format";
import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import type { Claim, OverviewSection } from "../../../lib/company/types";
import { meridianOverview } from "../../../lib/company/sample/overview";
import { MERIDIAN } from "../../../lib/company/sample/sources";
import { sampleCompanyGateway } from "../../../lib/company/sampleCompanyGateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { OverviewTab } from "./OverviewTab";

const failingGateway = alwaysFailingCompanyGateway();
/** A gateway whose Overview and Financials loads never answer, so the three cards stay loading. */
const pending = (): Promise<never> => new Promise(() => {});
const neverAnsweringGateway: CompanyGateway = {
	...failingGateway,
	getOverview: pending,
	getFinancials: pending,
};

const sampleGateway = sampleCompanyGateway();
/** A gateway whose Valuation section fails, so the P/E, P/FCF and P/B medians are missing. */
const valuationFailingGateway: CompanyGateway = {
	...sampleGateway,
	getValuation: failingGateway.getValuation,
};
/** A gateway whose Overview section fails and whose other sections load. */
const overviewFailingGateway: CompanyGateway = {
	...sampleGateway,
	getOverview: failingGateway.getOverview,
};
/** A gateway whose Overview section loads and whose Financials section fails. */
const financialsFailingGateway: CompanyGateway = {
	...sampleGateway,
	getFinancials: failingGateway.getFinancials,
};

/** A gateway whose latest quarter lacks total assets, so the long-term assets are missing. */
const missingTotalAssetsGateway: CompanyGateway = {
	...sampleGateway,
	getFinancials: async (ticker) => {
		const financials = await sampleGateway.getFinancials(ticker);
		const { balance } = financials;
		const lines = balance.quarterly.lines.map((line) =>
			line.key === "totalAssets"
				? { ...line, points: [...line.points.slice(0, -1), null] }
				: line,
		);
		return {
			...financials,
			balance: { ...balance, quarterly: { ...balance.quarterly, lines } },
		};
	},
};

/** A gateway whose latest quarterly balance sheet line `key` holds `value`. */
function latestBalanceGateway(key: string, value: number): CompanyGateway {
	return {
		...sampleGateway,
		getFinancials: async (ticker) => {
			const financials = await sampleGateway.getFinancials(ticker);
			const { balance } = financials;
			const lines = balance.quarterly.lines.map((line) => {
				const last = line.points.at(-1);
				return line.key === key && last
					? {
							...line,
							points: [...line.points.slice(0, -1), { ...last, value }],
						}
					: line;
			});
			return {
				...financials,
				balance: { ...balance, quarterly: { ...balance.quarterly, lines } },
			};
		},
	};
}

/** A gateway whose latest current liabilities are $1, well under 1% of the highest figure. */
const tinyLiabilitiesGateway = latestBalanceGateway(
	"totalCurrentLiabilities",
	1,
);
/** A gateway whose latest total liabilities are $1, so the long-term liabilities are negative. */
const negativeLiabilitiesGateway = latestBalanceGateway("totalLiabilities", 1);
/** A gateway whose latest current liabilities are a reported zero. */
const zeroLiabilitiesGateway = latestBalanceGateway(
	"totalCurrentLiabilities",
	0,
);

/** A gateway whose annual revenue of FY2020 is missing, so card 1.2 has a gap. */
const missingRevenueGateway: CompanyGateway = {
	...sampleGateway,
	getFinancials: async (ticker) => {
		const financials = await sampleGateway.getFinancials(ticker);
		const { income } = financials;
		const { periods, lines } = income.annual;
		const lines2020 = lines.map((line) =>
			line.key === "revenue"
				? {
						...line,
						points: line.points.map((point, index) =>
							periods[index]?.fiscalYear === 2020 ? null : point,
						),
					}
				: line,
		);
		return {
			...financials,
			income: { ...income, annual: { ...income.annual, lines: lines2020 } },
		};
	},
};

/** A gateway whose masthead fails, so V1, V2 and S2 have no price. */
const mastheadFailingGateway: CompanyGateway = {
	...sampleGateway,
	getMasthead: failingGateway.getMasthead,
};
/** A gateway whose Valuation load never answers. */
const valuationPendingGateway: CompanyGateway = {
	...sampleGateway,
	getValuation: pending,
};

/** Finds card 1.5 once its checks have drawn. */
async function checksCard(canvasElement: HTMLElement) {
	const card = await within(canvasElement).findByRole("region", {
		name: "1.5 Checks by Area",
	});
	await within(card).findByRole("region", { name: "Consistency" });
	return card;
}

/** Returns the result named by the icon of the check `name` in card 1.5. */
function checkResult(card: HTMLElement, name: string) {
	return within(card)
		.getByText(name)
		.closest("li")
		?.querySelector("[role=img]")
		?.getAttribute("aria-label");
}

/** A gateway whose Overview section is the sample one changed by `change`. */
function overviewGateway(
	change: (overview: OverviewSection) => OverviewSection,
): CompanyGateway {
	return {
		...sampleGateway,
		getOverview: async (ticker) =>
			change(await sampleGateway.getOverview(ticker)),
	};
}

/** A gateway whose profile names no auditor. */
const noAuditorGateway = overviewGateway((overview) => ({
	...overview,
	profile: { ...overview.profile, auditor: null },
}));

/** A gateway whose institutions hold `share` of the shares outstanding. */
function institutionsGateway(share: number): CompanyGateway {
	return overviewGateway((overview) => {
		const { ownership } = overview;
		const institutions = ownership.institutionShares as Claim;
		const outstanding = Number(ownership.sharesOutstanding?.value);
		return {
			...overview,
			ownership: {
				...ownership,
				institutionShares: { ...institutions, value: share * outstanding },
			},
		};
	});
}

/** Finds card `title` of the tab once the Overview section has drawn it. */
async function overviewCard(canvasElement: HTMLElement, title: string) {
	const card = await within(canvasElement).findByRole("region", {
		name: title,
	});
	await within(card).findByText(/Institutions|Founded/);
	return card;
}

/** Finds card 1.2 once its small charts have drawn. */
async function tenYearsCard(canvasElement: HTMLElement) {
	const card = await within(canvasElement).findByRole("region", {
		name: "1.2 Ten Years at a Glance",
	});
	await within(card).findByText("Diluted shares");
	return card;
}

/** Presses the "Data" button of card 1.2 and returns its table. */
async function tenYearsTable(card: HTMLElement) {
	await userEvent.click(within(card).getByRole("button", { name: "Data" }));
	return within(card).getByRole("table", {
		name: "Ten Years at a Glance table",
	});
}

/** Where the bar named `name` in card 1.4 sits against its zero line, in px. */
async function positionBarAt(canvasElement: HTMLElement, name: RegExp) {
	const button = await within(canvasElement).findByRole("button", { name });
	const bar = button.querySelector("[data-slot=position-bar]");
	const line = button
		.closest("[data-slot=position-plot]")
		?.querySelector("div[aria-hidden=true]");
	const box = bar?.getBoundingClientRect();
	const zero = line?.getBoundingClientRect().top ?? 0;
	return {
		top: Math.round((box?.top ?? 0) - zero),
		bottom: Math.round((box?.bottom ?? 0) - zero),
	};
}

/**
 * The Overview tab with the sample data of Meridian Semiconductor (MRDN).
 * It draws card 1.1 "The Business", card 1.2 "Ten Years at a Glance" and
 * card 1.3 "Key Figures", card 1.4 "Financial Position", then the sources
 * index.
 * A story sets its gateway in `parameters`. Without one, the tab reads the
 * default sample gateway.
 */
const meta: Meta<typeof OverviewTab> = {
	title: "Pages/Company/OverviewTab",
	component: OverviewTab,
	tags: ["autodocs"],
	args: { ticker: Ticker.parse("MRDN") },
	parameters: { layout: "padded" },
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
type Story = StoryObj<typeof OverviewTab>;

/** Play test: the card titles carry the numbers of DESIGN.md §8 "Overview". */
export const Loaded: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByText("Diluted shares");

		const expectedResult = [
			"1.1 The Business",
			"1.2 Ten Years at a Glance",
			"1.3 Key Figures",
			"1.4 Financial Position",
			"1.5 Checks by Area",
			"1.6 Who Owns It",
			"1.7 Profile",
		];

		const result = canvas
			.getAllByRole("heading", { level: 2 })
			.map((heading) => heading.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: on a phone the small charts sit two to a row. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		await within(canvasElement).findByText("Diluted shares");
		const charts = canvasElement.querySelectorAll(
			'[data-slot="mini-bar-chart"]',
		);

		const expectedResult = 2;

		const result = new Set(
			[...charts].map((chart) => chart.getBoundingClientRect().top),
		).size;

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: at a tablet width, between 768 and 1024 px, the desktop layout
 * holds, so the four small charts sit in one row (DESIGN.md §8 "Shared Layout").
 */
export const Tablet: Story = {
	globals: { viewport: { value: "tablet", isRotated: false } },
	play: async ({ canvasElement }) => {
		await within(canvasElement).findByText("Diluted shares");
		const charts = canvasElement.querySelectorAll(
			'[data-slot="mini-bar-chart"]',
		);

		const expectedResult = { width: true, rows: 1 };

		const result = {
			width: window.innerWidth >= 768 && window.innerWidth < 1024,
			rows: new Set(
				[...charts].map((chart) => chart.getBoundingClientRect().top),
			).size,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: the business text stays a paragraph of prose, and a short
 * "Source" after it opens the source card of the text.
 */
export const BusinessSource: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const text = String(meridianOverview.business?.value);
		const paragraph = await canvas.findByText(text);
		await userEvent.click(canvas.getByRole("button", { name: "Source" }));

		const expectedResult = {
			tag: "P",
			insideButton: false,
			card: "Sources of The business",
		};

		const result = {
			tag: paragraph.tagName,
			insideButton: paragraph.closest("button") !== null,
			card: (await screen.findByRole("dialog")).getAttribute("aria-label"),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a click on a segment's share pins the source card of that share. */
export const SegmentSource: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole("button", { name: "81.0%" }));

		const expectedResult = "Sources of Data centre share of revenue";

		const result = await screen.findByRole("dialog");

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};

/** Play test: a click on a key figure pins its source card with the formula. */
export const KeyFigureSource: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const row = await canvas.findByRole("row", { name: /^P\/E / });
		await userEvent.click(within(row).getAllByRole("button")[0]);

		const expectedResult = "Price ÷ diluted EPS, latest fiscal year";

		const result = await within(await screen.findByRole("dialog")).findByText(
			expectedResult,
		);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: the key figures read the masthead and Financials, not Overview.
 * So when Overview fails, card 1.3 still shows each figure, and only the
 * medians that Overview holds are dimmed dashes.
 */
export const KeyFiguresWithoutOverview: Story = {
	parameters: { companyGateway: overviewFailingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const row = await canvas.findByRole("row", { name: /^Operating margin / });

		const expectedResult = { figureMissing: false, median: "—" };

		const cells = within(row).getAllByRole("cell");
		const result = {
			figureMissing: cells[0]?.textContent === "—",
			median: cells.at(-1)?.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: while Valuation is missing, the P/E median is a dimmed dash. */
export const MissingMedian: Story = {
	parameters: { companyGateway: valuationFailingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const row = await canvas.findByRole("row", { name: /^P\/E / });

		const expectedResult = "—";

		const result = within(row).getAllByRole("cell").at(-1);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: Key Figures needs the Financials section too, so when it fails
 * the card says so instead of showing a dash for every figure.
 */
export const KeyFiguresNeedFinancials: Story = {
	parameters: { companyGateway: financialsFailingGateway },
	play: async ({ canvasElement }) => {
		const expectedResult =
			"The key figures did not load. Try again in a moment.";

		const result = await within(canvasElement).findByText(
			/key figures did not load/,
		);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: each card shows a spinner while its section loads. */
export const Loading: Story = {
	parameters: { companyGateway: neverAnsweringGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = 7;

		const result = within(canvasElement).getAllByRole("status").length;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a card whose section fails says so in one line. */
export const Failed: Story = {
	parameters: { companyGateway: failingGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = "The business did not load. Try again in a moment.";

		const result = await within(canvasElement).findByText(expectedResult);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: each card loads on its own. Overview loads and Financials fails,
 * so card 1.1 shows the business and card 1.2 says its figures did not load.
 */
export const OneSectionFails: Story = {
	parameters: { companyGateway: financialsFailingGateway },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const failure = "The ten-year figures did not load. Try again in a moment.";

		const expectedResult = { segmentShare: "81.0%", failure };

		const result = {
			segmentShare: (await canvas.findByRole("button", { name: "81.0%" }))
				.textContent,
			failure: (await canvas.findByText(failure)).textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: when the latest quarter lacks total assets, the long-term assets show a dimmed dash. */
export const FinancialPositionMissing: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	parameters: { companyGateway: missingTotalAssetsGateway },
	play: async ({ canvasElement }) => {
		const card = within(
			await within(canvasElement).findByRole("region", {
				name: "1.4 Financial Position",
			}),
		);
		await card.findAllByRole("button", { name: /^Short term / });

		const expectedResult = "Long term assets: —";

		const result = card.getByText(/^Long term assets:/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: on a phone, card 1.4 stacks below card 1.3, its plots and
 * legends fit inside the card, and each of its bars is a target of at least
 * 24 × 24 px inside its plot.
 */
export const FinancialPositionPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const card = await canvas.findByRole("region", {
			name: "1.4 Financial Position",
		});
		await within(card).findAllByRole("button", { name: /^Short term / });
		const position = card.getBoundingClientRect();
		const figures = canvas
			.getByRole("region", { name: "1.3 Key Figures" })
			.getBoundingClientRect();
		const plots = [...card.querySelectorAll("[data-slot=position-plot] ul")];
		const parts = [card, ...card.querySelectorAll("figure, dt, dd")];

		const expectedResult = {
			stacked: true,
			fits: true,
			targets: [true, true, true, true],
		};

		const result = {
			stacked: position.left === figures.left && position.top >= figures.bottom,
			fits: parts.every((part) => {
				const { left, right } = part.getBoundingClientRect();
				return (
					part.scrollWidth <= part.clientWidth &&
					left >= position.left &&
					right <= position.right
				);
			}),
			targets: plots.flatMap((plot) => {
				const box = plot.getBoundingClientRect();
				return [...plot.querySelectorAll("button")].map((button) => {
					const { width, height, left, right, top, bottom } =
						button.getBoundingClientRect();
					return (
						Math.min(width, height) >= 24 &&
						left >= box.left &&
						right <= box.right &&
						top >= box.top &&
						bottom <= box.bottom
					);
				});
			}),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the "Data" button of card 1.4 swaps the bars for a table of the four figures. */
export const FinancialPositionData: Story = {
	play: async ({ canvasElement }) => {
		const card = await within(canvasElement).findByRole("region", {
			name: "1.4 Financial Position",
		});
		await userEvent.click(within(card).getByRole("button", { name: "Data" }));
		const table = within(card).getByRole("table", {
			name: "Financial Position table",
		});

		const expectedResult = 4;

		const result = within(table).getAllByRole("cell").length;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a figure under 1% of the highest in card 1.4 still draws a visible bar. */
export const FinancialPositionTinyFigure: Story = {
	parameters: { companyGateway: tinyLiabilitiesGateway },
	play: async ({ canvasElement }) => {
		const button = await within(canvasElement).findByRole("button", {
			name: /^Short term liabilities/,
		});
		const bar = button.querySelector("[data-slot=position-bar]");

		const expectedResult = true;

		const result = (bar?.getBoundingClientRect().height ?? 0) >= 3;

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: a negative long-term figure in card 1.4 draws down from the zero line. */
export const FinancialPositionNegative: Story = {
	parameters: { companyGateway: negativeLiabilitiesGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = { startsAtZero: true, drawsDown: true };

		const { top, bottom } = await positionBarAt(
			canvasElement,
			/^Long term liabilities/,
		);
		const result = { startsAtZero: Math.abs(top) <= 1, drawsDown: bottom > 2 };

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a reported zero in card 1.4 draws a 2 px mark that ends on the zero line. */
export const FinancialPositionZero: Story = {
	parameters: { companyGateway: zeroLiabilitiesGateway },
	play: async ({ canvasElement }) => {
		const expectedResult = { top: -2, bottom: 0 };

		const result = await positionBarAt(
			canvasElement,
			/^Short term liabilities/,
		);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: the "Data" button of card 1.2 swaps the small charts for one
 * table with the same figures, one row for each chart and one column for
 * each year it draws.
 */
export const TenYearsData: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const card = await tenYearsCard(canvasElement);

		const expectedResult = [
			...card.querySelectorAll("[data-slot=mini-bar-chart]"),
		].map((chart) => [
			chart.querySelector("figcaption span")?.textContent,
			...within(chart as HTMLElement)
				.getAllByRole("listitem")
				.map((item) => item.textContent?.split(": ")[1]),
		]);

		const table = await tenYearsTable(card);
		const result = within(table)
			.getAllByRole("row")
			.slice(1)
			.map((row) =>
				[...row.querySelectorAll("th, td")].map((cell) => cell.textContent),
			);

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a missing year in the table of card 1.2 shows the dimmed dash. */
export const TenYearsDataMissingYear: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	parameters: { companyGateway: missingRevenueGateway },
	play: async ({ canvasElement }) => {
		const table = await tenYearsTable(await tenYearsCard(canvasElement));
		const column = within(table)
			.getAllByRole("columnheader")
			.findIndex((head) => head.textContent === "FY2020");
		const row = within(table).getByRole("row", { name: /^Revenue/ });
		const cell = row.querySelectorAll("th, td")[column];

		const expectedResult = { text: MISSING, dimmed: true };

		const result = {
			text: cell?.textContent,
			dimmed: cell?.querySelector(`span.${CSS.escape(MISSING_INK)}`) !== null,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: the "Sources" chip of card 1.2 opens the 10-Ks behind its charts. */
export const TenYearsSources: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const card = await tenYearsCard(canvasElement);
		await userEvent.click(
			within(card).getByRole("button", { name: "Sources" }),
		);
		const popup = await screen.findByRole("dialog", {
			name: "Sources of the chart",
		});

		const expectedResult = [
			2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017,
		].map((year) => `10-K for FY${year}, ${MERIDIAN}`);

		const result = within(popup)
			.getAllByRole("listitem")
			.map((item) => item.querySelector("p")?.textContent);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: on a phone the table of card 1.2 scrolls sideways inside the
 * card, and its first column stays fixed (DESIGN.md §8 "Shared Layout").
 */
export const TenYearsDataPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const card = await tenYearsCard(canvasElement);
		const table = await tenYearsTable(card);
		const scroller = table.parentElement as HTMLElement;
		const first = within(table).getByRole("rowheader", { name: "Revenue" });
		const before = first.getBoundingClientRect().left;

		const expectedResult = { scrolls: true, fixed: true, fits: true };

		scroller.scrollLeft = scroller.scrollWidth;
		const result = {
			scrolls: scroller.scrollLeft > 0,
			fixed: Math.abs(first.getBoundingClientRect().left - before) < 1,
			fits: card.getBoundingClientRect().right <= window.innerWidth,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: card 1.5 draws the five areas in the order of DESIGN.md §8, a
 * legend of the three results, and a ring count for each area.
 */
export const ChecksDesktop: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);
		const inCard = within(card);

		const expectedResult = {
			areas: [
				"Balance sheet",
				"Profitability",
				"Valuation",
				"Shareholder returns",
				"Consistency",
			],
			legend: ["Met", "Not met", "Not enough data"],
			rings: [
				"2 of 2 met",
				"1 of 2 met",
				"1 of 2 met",
				"2 of 3 met",
				"2 of 2 met",
			],
		};

		const result = {
			areas: inCard
				.getAllByRole("region")
				.map((area) => area.getAttribute("aria-label")),
			legend: within(inCard.getByRole("list", { name: "Results" }))
				.getAllByRole("listitem")
				.map((item) => item.textContent),
			rings: [...card.querySelectorAll("[data-slot=ring-count]")].map(
				(ring) => ring.textContent,
			),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: at 320 px, the areas of card 1.5 stack and the page does not scroll sideways. */
export const ChecksPhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);
		const areas = within(card).getAllByRole("region");

		const expectedResult = { columns: 1, pageScrolls: false };

		const result = {
			columns: new Set(
				areas.map((area) => Math.round(area.getBoundingClientRect().left)),
			).size,
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: with no masthead there is no price, so the P/E check has not enough data. */
export const ChecksNotEnoughData: Story = {
	parameters: { companyGateway: mastheadFailingGateway },
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);

		const expectedResult = "Not enough data";

		const result = checkResult(card, "P/E below its own 10-year median");

		await expect(result).toBe(expectedResult);
	},
};

/** Play test: while Valuation loads, V2 has not enough data and says a section has no data. */
export const ChecksValuationLoading: Story = {
	parameters: { companyGateway: valuationPendingGateway },
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);

		const expectedResult =
			"The free cash flow yield (2.3%) needs to be above the 10-year Treasury yield (—), but a section of the page has no data.";

		const result = within(card)
			.getByText(/^The free cash flow yield/)
			.closest("p");

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: a failed masthead never loads, so the P/E sentence says a
 * section has no data, and never asks the reader to wait for it.
 */
export const ChecksMastheadFailed: Story = {
	parameters: { companyGateway: mastheadFailingGateway },
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);

		const expectedResult =
			"The P/E (—) needs to be below its own 10-year median (—), but a section of the page has no data.";

		const result = within(card)
			.getByText(/^The P\/E/)
			.closest("p");

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/** Play test: card 1.5 says so when the Financials section fails to load. */
export const ChecksFailed: Story = {
	parameters: { companyGateway: financialsFailingGateway },
	play: async ({ canvasElement }) => {
		const card = await within(canvasElement).findByRole("region", {
			name: "1.5 Checks by Area",
		});

		const expectedResult = "The checks did not load. Try again in a moment.";

		const result = await within(card).findByText(/checks did not load/);

		await expect(result).toHaveTextContent(expectedResult);
	},
};

/**
 * Play test: C1 reads ten annual filings, and its source line names two and
 * counts the rest, so it stays one quiet line.
 */
export const ChecksSourceLine: Story = {
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);
		const item = within(card)
			.getByText("Free cash flow positive in at least 8 of 10 years")
			.closest("li") as HTMLElement;

		const expectedResult = true;

		const line = item.querySelector("[data-slot=source-line]")?.textContent;
		const result =
			/^Sources: 10-K for FY\d{4}, .+ · 10-K for FY\d{4}, .+ and \d+ more$/.test(
				line ?? "",
			);

		await expect(result).toBe(expectedResult);
	},
};

/** Returns the lightness and alpha of an `oklch(L C H / A)` color. */
function oklchOf(color: string): { lightness: number; alpha: number } {
	const [lightness = Number.NaN, , , alpha = 1] =
		color.match(/[\d.]+/g)?.map(Number) ?? [];
	return { lightness, alpha };
}

/**
 * Play test: in the light theme the track of each ring stays visible on the
 * white card. Blended over the card, its lightness differs from the card's by
 * at least 0.1.
 */
export const ChecksLight: Story = {
	globals: { viewport: { value: "desktop", isRotated: false }, theme: "light" },
	play: async ({ canvasElement }) => {
		const card = await checksCard(canvasElement);
		const track = card.querySelector("[data-slot=ring] circle") as SVGElement;
		const ink = oklchOf(getComputedStyle(track).stroke);
		const paper = oklchOf(getComputedStyle(card).backgroundColor);

		const expectedResult = true;

		const blended =
			ink.alpha * ink.lightness + (1 - ink.alpha) * paper.lightness;
		const result = Math.abs(paper.lightness - blended) >= 0.1;

		await expect(result).toBe(expectedResult);
	},
};

/**
 * Play test: on a desktop, card 1.6 "Who Owns It" and card 1.7 "Profile" sit
 * side by side, one column each. The link opens Relationships, and the
 * founding year prints as a year.
 */
export const OwnershipAndProfile: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	play: async ({ canvasElement }) => {
		const owners = await overviewCard(canvasElement, "1.6 Who Owns It");
		const profile = await overviewCard(canvasElement, "1.7 Profile");
		const left = owners.getBoundingClientRect();
		const right = profile.getBoundingClientRect();

		const expectedResult = {
			sideBySide: true,
			href: "/companies/MRDN/relationships",
			founded: "1993",
		};

		const result = {
			sideBySide: left.top === right.top && left.right < right.left,
			href: within(owners).getByRole("link").getAttribute("href"),
			founded: within(profile).getByText("Founded").nextSibling?.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: at 320 px, card 1.7 stacks below card 1.6, the page does not
 * scroll sideways, and the Relationships link is a 44 px tap target.
 */
export const OwnershipAndProfilePhone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const owners = await overviewCard(canvasElement, "1.6 Who Owns It");
		const profile = await overviewCard(canvasElement, "1.7 Profile");
		const link = within(owners).getByRole("link").getBoundingClientRect();

		const expectedResult = {
			stacked: true,
			pageScrolls: false,
			tapTarget: true,
		};

		const result = {
			stacked:
				profile.getBoundingClientRect().top >=
				owners.getBoundingClientRect().bottom,
			pageScrolls: document.documentElement.scrollWidth > window.innerWidth,
			tapTarget: link.height >= 44,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Play test: a profile with no auditor shows the dimmed dash for it. */
export const ProfileMissingAuditor: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	parameters: { companyGateway: noAuditorGateway },
	play: async ({ canvasElement }) => {
		const profile = await overviewCard(canvasElement, "1.7 Profile");

		const expectedResult = { text: MISSING, dimmed: true };

		const dash = within(profile).getByText("Auditor").nextSibling
			?.firstChild as HTMLElement;
		const result = {
			text: dash.textContent,
			dimmed: dash.classList.contains(MISSING_INK),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: when institutions hold 105% of the shares outstanding, the
 * institutions label prints 105.0% and the public prints the dimmed dash,
 * and the bar stays inside its track (DESIGN.md §8 "Overview").
 */
export const OwnershipOverflow: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	parameters: { companyGateway: institutionsGateway(1.05) },
	play: async ({ canvasElement }) => {
		const owners = await overviewCard(canvasElement, "1.6 Who Owns It");
		const track = owners.querySelector("[data-slot=share-bar] > div");
		const segments = [
			...owners.querySelectorAll("[data-slot=share-bar-segment]"),
		];
		const items = within(owners).getAllByRole("listitem");

		const expectedResult = {
			institutions: "Institutions105.0%",
			public: `Public${MISSING}`,
			segments: 2,
			fits: true,
		};

		const bar = track?.getBoundingClientRect();
		const result = {
			institutions: items[0]?.textContent,
			public: items[2]?.textContent,
			segments: segments.length,
			fits: segments.every(
				(segment) =>
					segment.getBoundingClientRect().right <= (bar?.right ?? 0) + 0.5,
			),
		};

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Play test: when institutions hold 99.9% and insiders hold the rest and
 * more, the public prints the dimmed dash and draws no segment, never 0% or
 * a negative share (DESIGN.md §8 "Overview").
 */
export const OwnershipPublicMissing: Story = {
	globals: { viewport: { value: "desktop", isRotated: false } },
	parameters: { companyGateway: institutionsGateway(0.999) },
	play: async ({ canvasElement }) => {
		const owners = await overviewCard(canvasElement, "1.6 Who Owns It");
		const items = within(owners).getAllByRole("listitem");

		const expectedResult = { public: `Public${MISSING}`, segments: 2 };

		const result = {
			public: items[2]?.textContent,
			segments: owners.querySelectorAll("[data-slot=share-bar-segment]").length,
		};

		await expect(result).toEqual(expectedResult);
	},
};
