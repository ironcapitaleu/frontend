import { within } from "storybook/test";

/**
 * Lists the bars of chart `plot` whose trigger is under 24 × 24 px or outside
 * the plot, or that draw nothing, and tells if the page scrolls sideways.
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

/** What {@link barTargetsOf} gives for a chart that follows the rules. */
export const BAR_TARGETS_OK = {
	smallTargets: [],
	targetsOutsidePlot: [],
	invisibleBars: [],
	pageScrollsSideways: false,
};
