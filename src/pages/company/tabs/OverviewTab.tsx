import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { formatInUnit } from "@/components/company/format";
import { MiniBarChart } from "@/components/company/MiniBarChart";
import { ShareBar } from "@/components/company/ShareBar";
import { SourceTrigger } from "@/components/company/SourceCard";
import { MISSING, MISSING_INK } from "@/components/screener/format";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { type CompanyState, useCompany } from "@/hooks/useCompany";
import type { CompletedSections } from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import { cn } from "@/lib/utils";
import { revenueParts, tenYearsSeries } from "./OverviewTab.logic";

/**
 * The Overview tab of the company page (DESIGN.md §8 "Overview"). It draws
 * card 1.1 "The Business" from the Overview section and card 1.2 "Ten Years
 * at a Glance" from the Financials section. Each card shows the loading or
 * failed state of its own section, so a slow section never delays the other
 * card.
 */
export function OverviewTab({ ticker }: { ticker: Ticker }) {
	const overview = useCompany(ticker, "overview");
	const financials = useCompany(ticker, "financials");

	return (
		<CompanyCardGrid>
			<CompanyCard
				tab="overview"
				position={1}
				title="The Business"
				caption="Latest fiscal year · Share of revenue · Form 10-K"
				span={2}
			>
				<Loaded state={overview} what="business">
					{({ data }) => (
						<div className="flex flex-col gap-6">
							{data.business === null ? (
								<p className={cn("font-monospace", MISSING_INK)}>{MISSING}</p>
							) : (
								// The text is prose, not a figure, so it stays a justified
								// paragraph and a short word after it opens its source.
								<div className="flex flex-col items-start gap-1">
									<p>{data.business.value}</p>
									<SourceTrigger
										claim={data.business}
										className="text-muted-foreground text-sm"
									>
										Source
									</SourceTrigger>
								</div>
							)}
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<ShareBar
									aria-label="Revenue by segment"
									parts={revenueParts(data, "segments")}
								/>
								<ShareBar
									aria-label="Revenue by region"
									parts={revenueParts(data, "regions")}
								/>
							</div>
						</div>
					)}
				</Loaded>
			</CompanyCard>
			<CompanyCard
				tab="overview"
				position={2}
				title="Ten Years at a Glance"
				caption="Last ten fiscal years · USD, percent and shares · Form 10-K"
				span={2}
			>
				<Loaded state={financials} what="ten-year figures">
					{({ sections }) => <TenYears sections={sections} />}
				</Loaded>
			</CompanyCard>
		</CompanyCardGrid>
	);
}

/**
 * The four small charts of card 1.2: two to a row on a phone and four from
 * 768 px, where DESIGN.md §8 "Shared Layout" keeps the desktop layout.
 */
function TenYears({ sections }: { sections: CompletedSections }) {
	// The same series on each render keep their claim identities stable.
	const series = React.useMemo(() => tenYearsSeries(sections), [sections]);
	return (
		<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
			{series.map((each) => (
				<MiniBarChart
					key={each.key}
					series={each}
					formatValue={(value) => formatInUnit(value, each.unit)}
				/>
			))}
		</div>
	);
}

/** The loaded state of the section `K`. */
type LoadedState<K extends "overview" | "financials"> = Extract<
	CompanyState<K>,
	{ status: "loaded" }
>;

/**
 * Draws `children` with the loaded section, or the state of its load: a
 * spinner while it loads, and one line when it fails.
 */
function Loaded<K extends "overview" | "financials">({
	state,
	what,
	children,
}: {
	state: CompanyState<K>;
	what: string;
	children: (loaded: LoadedState<K>) => React.ReactNode;
}) {
	switch (state.status) {
		case "loading":
			return <Spinner label={`Loading the ${what}`} />;
		case "loaded":
			return children(state as LoadedState<K>);
		default:
			return (
				<Text font="sans" className="text-left">
					The {what} did not load. Try again in a moment.
				</Text>
			);
	}
}
