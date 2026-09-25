import {
	CircleCheck,
	CircleDashed,
	CircleX,
	HandCoins,
	Landmark,
	type LucideIcon,
	Repeat,
	Scale,
	TrendingUp,
} from "lucide-react";
import * as React from "react";

import {
	type CheckArea,
	type CheckResult,
	type CheckState,
	evaluateChecks,
} from "@/lib/company/checks";
import { sourcesOf } from "@/lib/company/sources";
import type { CompletedSections } from "@/lib/company/types";
import { cn } from "@/lib/utils";
import {
	type SentencePart,
	sentenceClaims,
	sentenceOf,
} from "./ChecksByArea.logic";
import { FigureText } from "./FigureCell";

/** The name and icon of each area, in the order of `checkAreas`. */
const AREAS: Record<CheckArea, { label: string; icon: LucideIcon }> = {
	balanceSheet: { label: "Balance sheet", icon: Landmark },
	profitability: { label: "Profitability", icon: TrendingUp },
	valuation: { label: "Valuation", icon: Scale },
	shareholderReturns: { label: "Shareholder returns", icon: HandCoins },
	consistency: { label: "Consistency", icon: Repeat },
};

/** The name, icon and ink of each of the three results. */
const RESULTS: Record<
	CheckState,
	{ label: string; icon: LucideIcon; ink: string }
> = {
	met: { label: "Met", icon: CircleCheck, ink: "text-positive" },
	notMet: { label: "Not met", icon: CircleX, ink: "text-negative" },
	notEnoughData: {
		label: "Not enough data",
		icon: CircleDashed,
		ink: "text-muted-foreground",
	},
};

/**
 * The body of card 1.5 "Checks by Area" (DESIGN.md §8): a legend of the
 * three results, then the five areas, each with its icon, a ring of its met
 * checks, and its checks. Each check states its rule with the company's
 * figures inside the sentence, then its sources. The met counts are never
 * added together.
 */
export function ChecksByArea({ sections }: { sections: CompletedSections }) {
	const summaries = React.useMemo(() => evaluateChecks(sections), [sections]);
	return (
		<div className="flex flex-col gap-6">
			<ul aria-label="Results" className="flex flex-wrap gap-x-4 text-sm">
				{Object.values(RESULTS).map(({ label, icon: Icon, ink }) => (
					<li key={label} className="flex items-center gap-1.5">
						<Icon className={cn("size-4", ink)} aria-hidden="true" />
						{label}
					</li>
				))}
			</ul>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{summaries.map(({ area, results, metCount }) => {
					const { label, icon: Icon } = AREAS[area];
					return (
						<section key={area} aria-label={label}>
							<h3 className="mb-3 flex items-center gap-2 font-medium">
								<Icon className="size-4 text-muted-foreground" aria-hidden />
								{label}
								<Ring met={metCount} total={results.length} />
							</h3>
							<ul className="flex flex-col gap-3">
								{results.map((result) => (
									<CheckItem
										key={result.check.id}
										result={result}
										sentence={sentenceOf(result, sections)}
									/>
								))}
							</ul>
						</section>
					);
				})}
			</div>
		</div>
	);
}

/**
 * One check: its result icon, its name, its sentence with the figures inside
 * it, and a quiet line that names the documents behind those figures.
 */
function CheckItem({
	result,
	sentence,
}: {
	result: CheckResult;
	sentence: readonly SentencePart[];
}) {
	const { icon: Icon, label, ink } = RESULTS[result.state];
	const sources = sourcesOf(sentenceClaims(sentence)).groups.map(
		({ document: doc }) =>
			doc.kind === "filing" ? `${doc.form} for ${doc.periodLabel}` : doc.name,
	);
	return (
		<li className="flex gap-2">
			<Icon
				className={cn("mt-1 size-4 shrink-0", ink)}
				aria-label={label}
				role="img"
			/>
			<div className="min-w-0">
				<p className="font-medium">{result.check.name}</p>
				<p>
					{sentence.map((part) =>
						typeof part === "string" ? (
							part
						) : (
							<span key={part.key} className="font-monospace">
								<FigureText figure={part.figure} format={part.format} />
							</span>
						),
					)}
				</p>
				{sources.length > 0 && (
					<p className="text-muted-foreground text-sm">
						Source: {sources.join(" · ")}
					</p>
				)}
			</div>
		</li>
	);
}

/** A small ring that fills by the share of met checks, with the count beside it. */
function Ring({ met, total }: { met: number; total: number }) {
	const share = total === 0 ? 0 : met / total;
	return (
		<span className="ml-auto flex items-center gap-1.5 font-normal text-muted-foreground text-sm">
			<svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden>
				{[
					["stroke-muted", "1 0"],
					["stroke-chart-2", `${share} 1`],
				].map(([ink, dash]) => (
					<circle
						key={ink}
						{...{ cx: 10, cy: 10, r: 8, fill: "none", strokeWidth: 3 }}
						pathLength={1}
						strokeDasharray={dash}
						className={ink}
					/>
				))}
			</svg>
			<span data-slot="ring-count">
				{met} of {total} met
			</span>
		</span>
	);
}
