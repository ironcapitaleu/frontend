import { within } from "storybook/test";

/**
 * Measures every bar of the chart plot `plot`, a list of fiscal years: each
 * bar's trigger should be at least 24 px wide and tall and inside the plot,
 * each bar should draw, and the page should not scroll sideways. A play test
 * expects every list empty and `pageScrollsSideways` false.
 */
export function barTargetsOf(plot: HTMLElement) {
	const bars = within(plot).getAllByRole("button");
	const page = plot.ownerDocument.documentElement;
	const { top, bottom } = plot.getBoundingClientRect();
	return {
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
}

/** What {@link barTargetsOf} gives for a chart whose bars can all be tapped. */
export const TAPPABLE_BARS = {
	smallTargets: [],
	targetsOutsidePlot: [],
	invisibleBars: [],
	pageScrollsSideways: false,
};
