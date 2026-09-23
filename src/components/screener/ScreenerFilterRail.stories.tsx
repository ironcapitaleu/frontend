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
 * and sector chips, one `DistributionSlider` per metric in four groups, and the
 * "Near 52-week low" switch.
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
		canvas.getByRole("slider", { name: "P/FCF maximum" }).focus();
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
		filters: { ...STRATEGY_PRESETS[0].filters, search: "AAPL" },
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const onFiltersChange = args.onFiltersChange as ReturnType<typeof fn>;

		// The masthead owns the search, so the reset keeps it.
		const expectedResult = { ...EMPTY_FILTERS, search: "AAPL" };

		await userEvent.click(canvas.getByRole("button", { name: "Reset all" }));
		const result = onFiltersChange.mock.lastCall?.[0];

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * A 1M bound of "down at least 20%", past the usual end of the track at
 * −15%. The track widens to −20% so the slider shows the bound. It stays wide
 * while the rail is open, also after the bound is cleared, so a drag back
 * toward zero does not move the track under the pointer. The play test moves
 * the thumb one step and checks that the track keeps its −20% end.
 */
export const WideBound: Story = {
	args: {
		filters: { ...EMPTY_FILTERS, downLastMonth: "20" },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const thumb = canvas.getByRole("slider", { name: "1M change maximum" });
		const slider = within(
			thumb.closest('[data-slot="distribution-slider"]') as HTMLElement,
		);

		const expectedResult = { trackStart: "-20", readout: "≤ -19.5%" };

		thumb.focus();
		await userEvent.keyboard("{ArrowRight}");
		const result = {
			trackStart: thumb.getAttribute("min"),
			readout: slider.getByRole("status").textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};
