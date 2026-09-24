import * as React from "react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	feedsOf,
	isPrintedOnly,
	isSectorBenchmark,
	sourcesOf,
} from "@/lib/company/sources";
import type { Filing, FigureGroup } from "@/lib/company/types";
import { formatDate } from "./SourceCard";

/** Props for {@link SourcesIndex}. */
interface SourcesIndexProps {
	/** The figure groups of the tab, as `figureGroupsOf(tab, sections)` returns them. */
	groups: readonly FigureGroup[];
}

/**
 * The collapsed index "Where these numbers come from" at the foot of a tab
 * (DESIGN.md §8 "Shared Layout", region 4). It lists the filings behind the
 * tab's figures, newest first, each with its filing date, the figures it
 * feeds and a link to the filing. It skips the sector benchmark groups, so it
 * names no peer filing, and the groups only the printed page draws, so it
 * names no filing that no figure on the screen uses. It lists no market data.
 */
function SourcesIndex({ groups }: SourcesIndexProps) {
	const { filings, feeds } = React.useMemo(() => {
		const own = groups.filter(
			({ ref }) => !isSectorBenchmark(ref) && !isPrintedOnly(ref),
		);
		const documents = sourcesOf(own.flatMap(({ claims }) => claims)).groups.map(
			({ document }) => document,
		);
		return {
			filings: documents.filter(
				(document): document is Filing => document.kind === "filing",
			),
			feeds: feedsOf(own),
		};
	}, [groups]);

	return (
		<Accordion>
			<AccordionItem>
				<AccordionTrigger className="font-serif text-xl">
					Where these numbers come from
				</AccordionTrigger>
				<AccordionContent>
					{filings.length === 0 ? (
						<p className="text-muted-foreground">No filing feeds this tab.</p>
					) : (
						<ul className="flex flex-col gap-4">
							{filings.map((filing) => (
								<li
									key={filing.accessionNumber}
									className="flex flex-col gap-1"
								>
									<span className="font-medium">
										{filing.form} for {filing.periodLabel}, {filing.filer}
									</span>
									<span className="text-muted-foreground">
										Filed {formatDate(filing.filedOn)}
									</span>
									<span>
										Feeds{" "}
										{(feeds.get(filing.accessionNumber) ?? [])
											.map(({ label }) => label)
											.join(", ")}
									</span>
									<a
										href={filing.indexUrl}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline underline-offset-4"
									>
										Open the filing on SEC EDGAR
									</a>
								</li>
							))}
						</ul>
					)}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

export { SourcesIndex, type SourcesIndexProps };
