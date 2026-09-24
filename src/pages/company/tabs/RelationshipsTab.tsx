import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import { ShareBar } from "@/components/company/ShareBar";
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
import {
	fundChange,
	fundShare,
	ownershipShares,
} from "../../../lib/company/metrics";
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
 * index. Cards 5.1 to 5.3 are built. Row 3, the subsidiaries and the stakes,
 * comes with a later ticket of this track.
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
				<InsidersCard relationships={relationships} />
				<OwnershipSplitCard relationships={relationships} />
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

/** Card 5.2: the shares that each officer and director holds, from their latest Form 4. */
function InsidersCard({
	relationships,
}: {
	relationships: RelationshipsSection;
}) {
	return (
		<CompanyCard
			tab="relationships"
			position={2}
			title="Owned By: Insiders"
			caption="Shares held by each officer and director, from their latest Form 4"
		>
			{relationships.insiders.length === 0 ? (
				<p className="text-muted-foreground">No insider reports a holding.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="sticky left-0 bg-card">Insider</TableHead>
							<TableHead>Role</TableHead>
							<TableHead className="text-right">Shares</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{relationships.insiders.map((row) => (
							// Two insiders can share a name, so the key is the claim id of the shares.
							<TableRow key={row.shares?.id ?? `${row.name} ${row.role}`}>
								<TableHead scope="row" className="sticky left-0 bg-card">
									{row.name}
								</TableHead>
								<TableCell>{row.role}</TableCell>
								<FigureCell figure={row.shares} format={formatShares} />
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</CompanyCard>
	);
}

/** Card 5.3: the shares of the company that institutions, insiders and the public hold. */
function OwnershipSplitCard({
	relationships,
}: {
	relationships: RelationshipsSection;
}) {
	const shares = ownershipShares(relationships);
	return (
		<CompanyCard
			tab="relationships"
			position={3}
			title="Ownership Split"
			caption={`Share of the shares outstanding at ${formatDate(relationships.ownership.asOf)}, from 13F-HR filings, Form 4 and the latest 10-Q or 10-K`}
		>
			<ShareBar
				aria-label="Ownership split"
				parts={[
					{ label: "Institutions", share: shares.institutions },
					{ label: "Insiders", share: shares.insiders },
					{ label: "Public", share: shares.public },
				]}
			/>
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
