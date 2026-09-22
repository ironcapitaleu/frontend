import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
	type SortConfig,
	nextSortConfig,
	sortStocks,
} from "@/pages/public/StockScreener.logic";
import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { ScreenerTable } from "./ScreenerTable";

/**
 * The screener's results table. The columns sit under four groups, numbers are
 * right-aligned in mono, and a missing value reads as a dimmed dash. The last
 * column places the price inside its 52-week range with a `RangeBar`.
 *
 * Each story keeps the sort and the selection in state, so the headers and
 * rows respond as they do on the page. `onSort` and `onSelect` also reach the
 * Actions panel.
 */
const meta: Meta<typeof ScreenerTable> = {
	title: "Screener/ScreenerTable",
	component: ScreenerTable,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	args: {
		stocks: fakeStockScreenerResults,
		sortConfig: null,
		selectedSymbol: null,
		onSort: fn(),
		onSelect: fn(),
	},
	argTypes: {
		stocks: { control: { disable: true } },
		sortConfig: { control: { disable: true } },
		onSort: { control: { disable: true } },
		onSelect: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	render: function Render(args) {
		const [sortConfig, setSortConfig] = useState<SortConfig | null>(
			args.sortConfig,
		);
		const [selected, setSelected] = useState(args.selectedSymbol ?? null);
		const rows = sortConfig
			? sortStocks(args.stocks, sortConfig.field, sortConfig.direction)
			: args.stocks;
		return (
			<ScreenerTable
				{...args}
				stocks={rows}
				sortConfig={sortConfig}
				selectedSymbol={selected}
				onSort={(field) => {
					setSortConfig((previous) => nextSortConfig(previous, field));
					args.onSort(field);
				}}
				onSelect={(symbol) => {
					setSelected(symbol);
					args.onSelect(symbol);
				}}
			/>
		);
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The rows in input order. GAMMA shows the dimmed dashes of missing data. */
export const Default: Story = {};

/** Sorted by dividend yield, highest first. The column takes a light tint. */
export const Sorted: Story = {
	args: { sortConfig: { field: "dividendYield", direction: "desc" } },
};

/** BETA is selected, so its row carries the accent mark on its left edge. */
export const Selected: Story = {
	args: { selectedSymbol: "BETA" },
};

/** No row passes the filters. The table keeps its headers and says so. */
export const Empty: Story = {
	args: { stocks: [] },
};

/**
 * A tablet width, where the page shows the table and not the cards. The frame
 * is narrower than the table's minimum width, so the table scrolls sideways
 * inside it and the page itself never scrolls sideways.
 */
export const Tablet: Story = {
	globals: { viewport: { value: "tablet", isRotated: false } },
};

/** Two clicks on the P/E header sort the column from the highest P/E down. */
export const SortsByColumn: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const header = canvas.getByRole("button", { name: "P/E" });

		const expectedResult = {
			sort: "descending",
			firstRow: "DELTA",
		};

		await userEvent.click(header);
		await userEvent.click(header);
		const firstCompany = canvas.getAllByRole("button", {
			name: /· (US|DE)$/,
		})[0];
		const result = {
			sort: header.closest("th")?.getAttribute("aria-sort"),
			firstRow: firstCompany.querySelector("span")?.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** Tab to a company button and press Enter. The row becomes the selected row. */
export const SelectsWithKeyboard: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const company = canvas.getByRole("button", { name: /^BETA/ });

		const expectedResult = { state: "selected", reported: "BETA" };

		company.focus();
		await userEvent.keyboard("{Enter}");
		const result = {
			state: company.closest("tr")?.getAttribute("data-state"),
			reported: (args.onSelect as ReturnType<typeof fn>).mock.lastCall?.[0],
		};

		await expect(result).toEqual(expectedResult);
	},
};
