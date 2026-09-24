import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { CompanyGatewayProvider } from "../../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../../lib/company/gateway";
import { meridianOverview } from "../../../lib/company/sample/overview";
import { sampleCompanyGateway } from "../../../lib/company/sampleCompanyGateway";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../../../test/fixtures/companies/always-failing";
import { OverviewTab } from "./OverviewTab";

const failingGateway = alwaysFailingCompanyGateway();
/** A gateway whose two Overview loads never answer, so both cards stay loading. */
const pending = (): Promise<never> => new Promise(() => {});
const neverAnsweringGateway: CompanyGateway = {
	...failingGateway,
	getOverview: pending,
	getFinancials: pending,
};

/** A gateway whose Overview section loads and whose Financials section fails. */
const sampleGateway = sampleCompanyGateway();
/** A gateway whose Valuation section fails, so the P/E, P/FCF and P/B medians are missing. */
const valuationFailingGateway: CompanyGateway = {
	...sampleGateway,
	getValuation: failingGateway.getValuation,
};
const financialsFailingGateway: CompanyGateway = {
	...sampleGateway,
	getFinancials: failingGateway.getFinancials,
};

/**
 * The Overview tab with the sample data of Meridian Semiconductor (MRDN).
 * It draws card 1.1 "The Business", card 1.2 "Ten Years at a Glance" and
 * card 1.3 "Key Figures", then the sources index.
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
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<Story />
			</CompanyGatewayProvider>
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
		const expectedResult = 3;

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
