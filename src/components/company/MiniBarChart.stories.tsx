import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { meridianFinancials } from "@/lib/company/sample/financials";
import type { Claim, Series } from "@/lib/company/types";
import { formatMarketCap } from "../screener/format";
import { MiniBarChart } from "./MiniBarChart";

const revenue = meridianFinancials.income.annual.lines.find(
	(line) => line.key === "revenue",
) as Series;

/** The revenue series with some values replaced. `null` is a missing point. */
function withValues(values: Record<number, number | null>): Series {
	return {
		...revenue,
		points: revenue.points.map((point, index) =>
			index in values
				? values[index] === null
					? null
					: { ...(point as Claim), value: values[index] as number }
				: point,
		),
	};
}

/** Writes a signed dollar amount in billions, such as `$212.0B` or `−$4.0B`. */
function formatBillions(value: number): string {
	return `${value < 0 ? "−" : ""}${formatMarketCap(Math.abs(value))}`;
}

/**
 * The small yearly bar chart of the company page, with the revenue of the
 * sample company Meridian Semiconductor. The stories cover ten full years, a
 * negative year, a missing year, a value that is not finite, a single year,
 * every year missing, no years at all, and the phone width.
 */
const meta: Meta<typeof MiniBarChart> = {
	title: "Company/MiniBarChart",
	component: MiniBarChart,
	tags: ["autodocs"],
	args: { series: revenue, formatValue: formatBillions },
	decorators: [
		(Story) => (
			<div className="max-w-60 p-6">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof MiniBarChart>;

/** Ten fiscal years of revenue, all positive. The latest year draws in a stronger fill. */
export const Full: Story = {
	play: async ({ canvasElement }) => {
		// The bars are aria-hidden, so no role query reaches them.
		const bars = canvasElement.querySelectorAll(
			'[data-slot="mini-bar-chart-bar"]',
		);

		const expectedResult = true;

		const result = bars[bars.length - 1]?.classList.contains("bg-chart-3");

		await expect(result).toBe(expectedResult);
	},
};

/** One year below zero. Its bar draws down from the zero line. */
export const Negative: Story = {
	args: { series: withValues({ 3: -40_000_000_000 }) },
};

/**
 * One year is missing. It leaves a gap with a dot on the zero line, and the
 * text alternative lists it with a dash.
 */
export const Missing: Story = {
	args: { series: withValues({ 4: null }) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const expectedResult = "FY2021: —";

		const result = canvas.getAllByRole("listitem")[4]?.textContent;

		await expect(result).toBe(expectedResult);
	},
};

/** A value that is not a finite number draws as a missing year, never as a bar. */
export const NotFinite: Story = {
	args: { series: withValues({ 6: Number.NaN }) },
};

/** A company with one fiscal year shows that one year. */
export const SingleYear: Story = {
	args: {
		series: {
			...revenue,
			periods: revenue.periods.slice(-1),
			points: revenue.points.slice(-1),
		},
	},
};

/** Every year is missing. The chart shows only gaps and a dimmed dash as the latest figure. */
export const AllMissing: Story = {
	args: {
		series: { ...revenue, points: revenue.points.map(() => null) },
	},
};

/** A company with no filed years draws no bars and prints a dimmed dash. */
export const NoYears: Story = {
	args: { series: { ...revenue, periods: [], points: [] } },
};

/**
 * On a phone the chart fills its card. Overview sets two charts to a row.
 * Play test: a tap on the oldest bar opens the sources of that year in a sheet.
 */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
	play: async ({ canvasElement }) => {
		const oldest = within(canvasElement).getAllByRole("button")[1];
		await userEvent.click(oldest as HTMLElement);

		const expectedResult = `Sources of ${revenue.points[0]?.label}`;

		const result = await screen.findByRole("dialog");

		await expect(result).toHaveAccessibleName(expectedResult);
	},
};
