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

/**
 * Lists the bars of chart `plot` that no pointer reaches, because another
 * element covers every point down the middle of the bar. Each bar scrolls
 * into view first, since only a point on screen can be hit.
 */
export function unreachableBarsOf(plot: HTMLElement) {
	const page = plot.ownerDocument;
	return within(plot)
		.getAllByRole("button")
		.filter((bar) => {
			bar.scrollIntoView({ block: "nearest", inline: "nearest" });
			const { left, width, top, bottom } = bar.getBoundingClientRect();
			for (let y = top + 0.5; y < bottom; y++) {
				const hit = page.elementFromPoint(left + width / 2, y);
				if (hit !== null && bar.contains(hit)) return false;
			}
			return true;
		});
}
