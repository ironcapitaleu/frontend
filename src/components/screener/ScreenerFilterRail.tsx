import type * as React from "react";

import { DistributionSlider } from "@/components/ui/distribution-slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
	EMPTY_FILTERS,
	type FilterState,
	type Stock,
} from "@/pages/public/StockScreener.logic";

import {
	RAIL_GROUPS,
	applyMetricRange,
	distinctValues,
	hasActiveFilters,
	metricBounds,
	metricRange,
} from "./ScreenerFilterRail.logic";

/** The toggle value that stands for "no country" or "no sector" filter. */
const ALL = "ALL";

interface ScreenerFilterRailProps
	extends Omit<React.ComponentProps<"aside">, "children"> {
	/** The universe. The chips list its countries and sectors, and the histograms chart it. */
	stocks: readonly Stock[];
	/** The current filters. The rail is controlled. */
	filters: FilterState;
	/** Called with the whole new filter state after any change in the rail. */
	onFiltersChange: (filters: FilterState) => void;
}

/**
 * The screener's filter column. It shows every filter at once, so the reader
 * adjusts a screen and watches the results change without opening a panel.
 *
 * From top to bottom it holds the universe chips (country and sector), one
 * `DistributionSlider` per metric grouped like the table's columns, and the
 * signal switches. The rail is controlled: it renders `filters` and reports
 * each change through `onFiltersChange`.
 */
function ScreenerFilterRail({
	stocks,
	filters,
	onFiltersChange,
	className,
	...props
}: ScreenerFilterRailProps) {
	const update = (patch: Partial<FilterState>) =>
		onFiltersChange({ ...filters, ...patch });

	return (
		<aside
			aria-label="Filters"
			className={cn("flex flex-col gap-5", className)}
			{...props}
		>
			<div className="flex items-baseline justify-between">
				<h2 className="font-sans-serif text-xl font-semibold">Filters</h2>
				<button
					type="button"
					disabled={!hasActiveFilters(filters)}
					onClick={() => onFiltersChange(EMPTY_FILTERS)}
					className="cursor-pointer text-base text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-50 disabled:hover:text-muted-foreground"
				>
					Reset all
				</button>
			</div>

			<RailSection title="Universe">
				<UniverseChips
					label="Country"
					options={distinctValues(stocks, "country")}
					value={filters.country}
					onChange={(country) => update({ country })}
					mono
				/>
				<UniverseChips
					label="Sector"
					options={distinctValues(stocks, "sector")}
					value={filters.sector}
					onChange={(sector) => update({ sector })}
				/>
			</RailSection>

			{RAIL_GROUPS.map((group) => (
				<RailSection key={group.title} title={group.title}>
					{group.metrics.map((metric) => (
						<DistributionSlider
							key={metric.label}
							label={metric.label}
							values={stocks.map((stock) => stock[metric.stockField])}
							min={metric.min}
							max={metric.max}
							step={metric.step}
							bounds={metricBounds(metric)}
							value={metricRange(metric, filters)}
							onValueChange={(range) =>
								onFiltersChange(applyMetricRange(metric, filters, range))
							}
							formatValue={(value) => `${value.toFixed(1)}${metric.unit}`}
						/>
					))}
				</RailSection>
			))}

			<RailSection title="Signals">
				<div className="flex items-center justify-between gap-3">
					<Label htmlFor="near-52-week-low" className="text-lg font-normal">
						Near 52-week low
					</Label>
					<Switch
						id="near-52-week-low"
						checked={filters.nearFiftyTwoWeekLow}
						onCheckedChange={(checked) =>
							update({ nearFiftyTwoWeekLow: checked })
						}
					/>
				</div>
			</RailSection>
		</aside>
	);
}

/** A titled rail section, separated from the one above by a hairline. */
function RailSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section
			aria-label={title}
			className="flex flex-col gap-4 border-t border-border pt-4 first-of-type:border-t-0 first-of-type:pt-0"
		>
			<h3 className="font-sans-serif text-sm font-medium tracking-wider text-muted-foreground uppercase">
				{title}
			</h3>
			{children}
		</section>
	);
}

/** A labelled row of single-choice chips with an "All" chip first. */
function UniverseChips({
	label,
	options,
	value,
	onChange,
	mono = false,
}: {
	label: string;
	options: readonly string[];
	value: string;
	onChange: (value: string) => void;
	mono?: boolean;
}) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-base text-muted-foreground">{label}</span>
			<ToggleGroup
				aria-label={label}
				variant="outline"
				size="sm"
				spacing={1.5}
				className="w-full flex-wrap"
				value={[value || ALL]}
				onValueChange={(next) => {
					const picked = next[0];
					onChange(!picked || picked === ALL ? "" : picked);
				}}
			>
				{[ALL, ...options].map((option) => (
					<ToggleGroupItem
						key={option}
						value={option}
						className={cn(
							"data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background",
							mono && option !== ALL && "font-monospace",
						)}
					>
						{option === ALL ? "All" : option}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
}

export { ScreenerFilterRail, type ScreenerFilterRailProps };
