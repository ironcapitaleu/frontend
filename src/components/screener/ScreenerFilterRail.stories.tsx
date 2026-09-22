import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
	EMPTY_FILTERS,
	type FilterState,
	STRATEGY_PRESETS,
} from "@/pages/public/StockScreener.logic";
import { fakeStockScreenerResults } from "@/test/fixtures/stocks/fake-stock-screener-results";

import { ScreenerFilterRail } from "./ScreenerFilterRail";

/**
 * The screener's filter column. Every filter is visible at once: the country
 * and sector chips, one `DistributionSlider` per metric in the same groups as
 * the table's columns, and the "Near 52-week low" switch.
 *
 * The rail is controlled. Each story keeps the filters in state and forwards
 * every change to the `onFiltersChange` action, so the Actions panel shows the
 * exact `FilterState` the page receives.
 */
const meta: Meta<typeof ScreenerFilterRail> = {
	title: "Screener/ScreenerFilterRail",
	component: ScreenerFilterRail,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	args: {
		stocks: fakeStockScreenerResults,
		filters: EMPTY_FILTERS,
		onFiltersChange: fn(),
	},
	argTypes: {
		stocks: { control: { disable: true } },
		filters: { control: { disable: true } },
		onFiltersChange: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	render: function Render(args) {
		const [filters, setFilters] = useState<FilterState>(args.filters);
		return (
			<ScreenerFilterRail
				{...args}
				className="w-72"
				filters={filters}
				onFiltersChange={(next) => {
					setFilters(next);
					args.onFiltersChange(next);
				}}
			/>
		);
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** No filter is active. Every slider reads `Any` and "Reset all" is disabled. */
export const Empty: Story = {};

/**
 * The "Income at a fair price" preset: P/E at most 20 and a dividend yield of
 * at least 2%. The two sliders light their selected bars in the accent.
 */
export const WithPreset: Story = {
	args: {
		filters: STRATEGY_PRESETS[1].filters,
	},
};

/**
 * Picking a country chip and moving the P/FCF thumb both reach the page as one
 * `FilterState` each. The last call carries both changes.
 */
export const ReportsChanges: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const onFiltersChange = args.onFiltersChange as ReturnType<typeof fn>;

		const expectedResult = { country: "DE", priceToFcfMax: "44.5" };

		await userEvent.click(canvas.getByRole("button", { name: "DE" }));
		canvas.getByRole("slider", { name: "P/FCF" }).focus();
		await userEvent.keyboard("{ArrowLeft}");
		const lastCall = onFiltersChange.mock.lastCall?.[0] as FilterState;
		const result = {
			country: lastCall.country,
			priceToFcfMax: lastCall.priceToFcfMax,
		};

		await expect(result).toEqual(expectedResult);
	},
};

/** "Reset all" clears every criterion and hands back the empty state. */
export const ResetsAll: Story = {
	args: {
		filters: STRATEGY_PRESETS[0].filters,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const onFiltersChange = args.onFiltersChange as ReturnType<typeof fn>;

		const expectedResult = EMPTY_FILTERS;

		await userEvent.click(canvas.getByRole("button", { name: "Reset all" }));
		const result = onFiltersChange.mock.lastCall?.[0];

		await expect(result).toEqual(expectedResult);
	},
};
