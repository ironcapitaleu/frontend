import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import { MISSING } from "@/components/screener/format";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useCompany } from "@/hooks/useCompany";
import { COMPANY_TABS } from "@/lib/company/tabs";
import type { Filing } from "@/lib/company/types";
import type { Ticker } from "@/lib/domain/ticker";
import {
	type FedFigure,
	fedFiguresOf,
	filedOnText,
	filingsGroupsOf,
} from "./FilingsTab.logic";
import { joinSections, loadedSections } from "./OverviewTab.logic";

/**
 * The Filings tab (DESIGN.md §8 "Filings"). Card 7.1 "Filings We Read" lists
 * the filings, newest first. The chips by type come in a second PR. Each row
 * names the figures the filing feeds, from the other sections. Each load adds
 * its figures when it resolves, and a failed one leaves them out, so the card
 * waits for the Filings section alone. The card is the full list, so the tab
 * has no sources index.
 */
export function FilingsTab({ ticker }: { ticker: Ticker }) {
	const filings = useCompany(ticker, "filings");
	const [a, b, c, d, e, f, g] = [
		useCompany(ticker, "masthead"),
		useCompany(ticker, "overview"),
		useCompany(ticker, "financials"),
		useCompany(ticker, "valuation"),
		useCompany(ticker, "shareholderReturns"),
		useCompany(ticker, "relationships"),
		useCompany(ticker, "management"),
	].map(loadedSections);
	// Loaded sections keep their identity across renders, so the walk over the
	// figure groups runs again only when a section loads.
	const fed = React.useMemo(() => {
		const sections = joinSections([a, b, c, d, e, f, g]);
		return fedFiguresOf(sections ? filingsGroupsOf(sections) : []);
	}, [a, b, c, d, e, f, g]);
	const list = filings.status === "loaded" ? filings.data.filings : [];

	return (
		<CompanyCardGrid>
			<CompanyCard
				tab="filings"
				position={1}
				title="Filings We Read"
				caption="Every filing behind this page · Newest first · SEC EDGAR"
				span={2}
			>
				{filings.status === "loading" ? (
					<Spinner label="Loading the filings" />
				) : filings.status !== "loaded" ? (
					<Text font="sans" className="text-left">
						The filings did not load. Try again in a moment.
					</Text>
				) : list.length === 0 ? (
					<Text font="sans" className="text-left">
						No filing feeds a figure on this page yet.
					</Text>
				) : (
					<ul className="flex flex-col divide-y divide-border">
						{list.map((filing) => (
							<FilingRow
								key={filing.accessionNumber}
								filing={filing}
								fed={fed.get(filing.accessionNumber) ?? []}
							/>
						))}
					</ul>
				)}
			</CompanyCard>
		</CompanyCardGrid>
	);
}

/** One filing: its type, period, filer and date, the figures it feeds and its EDGAR link. */
function FilingRow({
	filing,
	fed,
}: {
	filing: Filing;
	fed: readonly FedFigure[];
}) {
	return (
		<li
			data-accession={filing.accessionNumber}
			className="flex flex-col gap-1 py-3"
		>
			<p>
				<span className="font-medium">{filing.form}</span> for{" "}
				{filing.periodLabel || MISSING}, {filing.filer}
			</p>
			<p className="text-muted-foreground">
				Filed{" "}
				<span className="font-monospace">{filedOnText(filing.filedOn)}</span>
			</p>
			{fed.length > 0 && (
				<p>
					Feeds{" "}
					{fed.map(({ ref, claim }, position) => (
						<React.Fragment key={`${ref.block}.${ref.figures}`}>
							{position > 0 && ", "}
							<SourceTrigger claim={claim}>
								{COMPANY_TABS.find(({ key }) => key === ref.tab)?.label}:{" "}
								{ref.label}
							</SourceTrigger>
						</React.Fragment>
					))}
				</p>
			)}
			<a
				href={filing.indexUrl}
				target="_blank"
				rel="noreferrer"
				className="inline-flex min-h-11 items-center self-start text-primary underline underline-offset-4 md:min-h-0"
			>
				Open the filing on SEC EDGAR
			</a>
		</li>
	);
}
