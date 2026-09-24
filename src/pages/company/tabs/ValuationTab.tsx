import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import {
	formatNumber,
	MISSING,
	MISSING_INK,
} from "@/components/screener/format";
import { rangeBarPosition } from "@/components/ui/range-bar";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useCompany } from "../../../hooks/useCompany";
import { metrics } from "../../../lib/company/metrics";
import type { CompletedSections, Figure } from "../../../lib/company/types";
import {
	type RatioRange,
	ratioRanges,
	ratioScale,
} from "../../../lib/company/valuationRatios";
import type { Ticker } from "../../../lib/domain/ticker";

/**
 * The Valuation tab of the company page (DESIGN.md §8 "Valuation"). It loads
 * the masthead, the financials and the valuation section, and shows card 3.1.
 */
export function ValuationTab({ ticker }: { ticker: Ticker }) {
	const masthead = useCompany(ticker, "masthead");
	const financials = useCompany(ticker, "financials");
	const valuation = useCompany(ticker, "valuation");

	if ([masthead, financials, valuation].some((s) => s.status === "loading")) {
		return <Spinner size="lg" label="Loading valuation" />;
	}
	if (
		masthead.status !== "loaded" ||
		financials.status !== "loaded" ||
		valuation.status !== "loaded"
	) {
		return (
			<Text font="sans" size="lg" className="text-left">
				The valuation figures did not load. Try again in a moment.
			</Text>
		);
	}
	const sections: CompletedSections = {
		...financials.sections,
		masthead: masthead.data,
		valuation: valuation.data,
	};
	return (
		<CompanyCardGrid>
			<CompanyCard
				tab="valuation"
				position={1}
				span={2}
				title="Ratios Against Their Own Ten Years and the Sector"
				caption="Now, the last ten fiscal year ends and the sector's quartiles. Multiples, from 10-K filings and daily prices."
			>
				<ul className="flex flex-col gap-6">
					{ratioRanges(sections).map((range) => (
						<RatioRow key={range.ratio} range={range} />
					))}
				</ul>
			</CompanyCard>
		</CompanyCardGrid>
	);
}

/** One ratio: its figure now, then a bar of its own ten years and a bar of the sector. */
function RatioRow({ range }: { range: RatioRange }) {
	const { sector } = range;
	const scale = ratioScale(range);
	return (
		<li className="grid gap-2 md:grid-cols-[8rem_1fr] md:gap-4">
			<div className="flex items-baseline justify-between gap-2 md:flex-col md:justify-start">
				<span className="font-medium">{metrics[range.ratio].name}</span>
				<Value figure={range.now} />
			</div>
			<div className="flex flex-col gap-3">
				<RangeRow
					label={["Own", "Own 10 years"]}
					band="bg-chart-2"
					figures={[range.ownLow, range.ownMedian, range.ownHigh]}
					now={range.now}
					scale={scale}
				/>
				<RangeRow
					label={["Sector", "Sector quartiles"]}
					band="bg-chart-4"
					figures={
						sector
							? [sector.lowerQuartile, sector.median, sector.upperQuartile]
							: [null, null, null]
					}
					now={range.now}
					scale={scale}
				/>
			</div>
		</li>
	);
}

/**
 * One range bar: the range as a band, the median as a tick and the figure now
 * as a dot, with the low, the median and the high printed below. `label`
 * holds the phone label and the desktop label.
 */
function RangeRow(props: {
	label: [string, string];
	band: string;
	figures: [Figure, Figure, Figure];
	now: Figure;
	scale: [number, number];
}) {
	const [low, median, high] = props.figures;
	const at = (figure: Figure) =>
		figure && rangeBarPosition(Number(figure.value), ...props.scale)?.percent;
	const [left, right] = [at(low), at(high)];
	const ranged = left != null && right != null;
	const marks = [
		[at(median), "top-0 h-3 w-0.5 bg-foreground"],
		[ranged && at(props.now), "top-0.5 size-2.5 rounded-full bg-primary"],
	] as const;
	return (
		<div className="grid grid-cols-[4rem_1fr] items-start gap-3 md:grid-cols-[8rem_1fr]">
			<span className="text-sm text-muted-foreground">
				<span className="md:hidden">{props.label[0]}</span>
				<span className="hidden md:inline">{props.label[1]}</span>
			</span>
			<div className="flex flex-col gap-1">
				<div className="relative h-3" aria-hidden="true">
					<div className="absolute inset-x-0 top-1/2 h-px bg-border" />
					{ranged && (
						<div
							className={cn("absolute top-0.75 h-1.5 rounded-full", props.band)}
							style={{ left: `${left}%`, width: `${right - left}%` }}
						/>
					)}
					{marks.map(
						([position, mark]) =>
							typeof position === "number" && (
								<div
									key={mark}
									className={cn("absolute -translate-x-1/2", mark)}
									style={{ left: `${position}%` }}
								/>
							),
					)}
				</div>
				<div className="flex justify-between gap-2 text-sm">
					<Value figure={low} />
					<span>
						<span className="text-muted-foreground">median </span>
						<Value figure={median} />
					</span>
					<Value figure={high} />
				</div>
			</div>
		</div>
	);
}

/** A ratio as the page prints it, with its sources, or the dimmed dash when it is missing. */
function Value({ figure }: { figure: Figure }) {
	return figure === null ? (
		<span className={cn("font-monospace", MISSING_INK)}>{MISSING}</span>
	) : (
		<SourceTrigger claim={figure} className="font-monospace">
			{formatNumber(Number(figure.value))}
		</SourceTrigger>
	);
}
