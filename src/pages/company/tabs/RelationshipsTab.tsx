import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import {
	formatPercent,
	formatSignedPercent,
	MISSING,
	MISSING_INK,
} from "@/components/screener/format";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { useCompany } from "../../../hooks/useCompany";
import { formatDate } from "../../../lib/company/dates";
import { listedFundPositions } from "../../../lib/company/holdings";
import { fundChange, fundShare } from "../../../lib/company/metrics";
import { figureGroupsOf } from "../../../lib/company/sources";
import type {
	CompletedSections,
	Figure,
	RelationshipsSection,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { formatShares } from "./relationships";

/**
 * The Relationships tab of the company page (DESIGN.md §8 "Relationships").
 * It loads the Relationships section and shows its cards, then the sources
 * index. Card 5.1 "Owned By: Largest Funds" is built. The later cards of the
 * tab come with the next ticket of this track.
 */
export function RelationshipsTab({ ticker }: { ticker: Ticker }) {
	const state = useCompany(ticker, "relationships");

	switch (state.status) {
		case "loading":
			return (
				<div className="flex justify-center py-16">
					<Spinner size="lg" label="Loading relationships" />
				</div>
			);
		case "missing":
		case "failed":
			return (
				<Text font="sans" size="lg" className="text-left">
					The relationships did not load. Something went wrong on our side. Try
					again in a moment.
				</Text>
			);
		case "loaded":
			return (
				<LoadedRelationships
					relationships={state.data}
					sections={state.sections}
				/>
			);
	}
}

/** The cards of the loaded tab, then the sources index. */
function LoadedRelationships({
	relationships,
	sections,
}: {
	relationships: RelationshipsSection;
	sections: CompletedSections;
}) {
	// The same `groups` on each render lets `SourcesIndex` keep its memo.
	const groups = React.useMemo(
		() => figureGroupsOf("relationships", sections),
		[sections],
	);
	return (
		<div className="flex flex-col gap-10">
			<CompanyCardGrid>
				<LargestFundsCard relationships={relationships} />
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/** Card 5.1: the largest 13F funds, with their shares, their share of the company and their change over a quarter. */
function LargestFundsCard({
	relationships,
}: {
	relationships: RelationshipsSection;
}) {
	const positions = listedFundPositions(relationships.funds);
	return (
		<CompanyCard
			tab="relationships"
			position={1}
			title="Owned By: Largest Funds"
			caption={`Shares at ${formatDate(relationships.ownership.asOf)} and change against the quarter before, from 13F-HR filings`}
			span={2}
		>
			{positions.length === 0 ? (
				<p className="text-muted-foreground">No fund reports a holding.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="sticky left-0 bg-card">Fund</TableHead>
							<TableHead className="text-right">Shares</TableHead>
							<TableHead className="text-right">Of the company</TableHead>
							<TableHead className="text-right">
								Change over the quarter
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{positions.map((position) => {
							const row = relationships.funds[position];
							return (
								<TableRow key={position}>
									<TableHead scope="row" className="sticky left-0 bg-card">
										{row.fund}
									</TableHead>
									<FigureCell figure={row.shares} format={formatShares} />
									<FigureCell
										figure={fundShare(relationships, position)}
										format={(value) => formatPercent(value * 100)}
									/>
									<FigureCell
										figure={fundChange(relationships, position)}
										format={(value) => formatSignedPercent(value * 100)}
									/>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</CompanyCard>
	);
}

/** A right-aligned mono figure that opens its sources, or the dimmed dash when it is missing. */
function FigureCell({
	figure,
	format,
}: {
	figure: Figure;
	format: (value: number) => string;
}) {
	return (
		<TableCell className="text-right font-monospace">
			{figure !== null && typeof figure.value === "number" ? (
				<SourceTrigger claim={figure}>{format(figure.value)}</SourceTrigger>
			) : (
				<span className={MISSING_INK}>{MISSING}</span>
			)}
		</TableCell>
	);
}
