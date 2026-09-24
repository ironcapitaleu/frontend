import * as React from "react";
import { Link } from "react-router";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { ShareBar } from "@/components/company/ShareBar";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import {
	formatPercent,
	formatSignedPercent,
} from "@/components/screener/format";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
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
	stakePercent,
} from "../../../lib/company/metrics";
import { servesTicker } from "../../../lib/company/sampleCompanies";
import { figureGroupsOf } from "../../../lib/company/sources";
import type {
	CompletedSections,
	RelationshipsSection,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { ClaimCell, FigureCell } from "./FigureCell";
import { InsiderTable } from "./InsiderTable";
import { formatShares } from "./relationships";

/**
 * The Relationships tab of the company page (DESIGN.md §8 "Relationships").
 * It loads the Relationships section and shows its cards, then the sources
 * index. A stake links to the page of its company only when `hasCompanyPage`
 * says that page exists, as in the screener. A test can pass its own check.
 */
export function RelationshipsTab({
	ticker,
	hasCompanyPage = servesTicker,
}: {
	ticker: Ticker;
	hasCompanyPage?: (ticker: Ticker) => boolean;
}) {
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
					hasCompanyPage={hasCompanyPage}
				/>
			);
	}
}

/** The cards of the loaded tab, then the sources index. */
function LoadedRelationships({
	relationships,
	sections,
	hasCompanyPage,
}: {
	relationships: RelationshipsSection;
	sections: CompletedSections;
	hasCompanyPage: (ticker: Ticker) => boolean;
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
				<SubsidiariesCard relationships={relationships} />
				<StakesCard
					relationships={relationships}
					hasCompanyPage={hasCompanyPage}
				/>
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
			<InsiderTable insiders={relationships.insiders} />
		</CompanyCard>
	);
}

/** Card 5.3: the shares of the company that institutions, insiders and the public hold. */
function OwnershipSplitCard({
	relationships,
}: {
	relationships: RelationshipsSection;
}) {
	const shares = ownershipShares(relationships, "relationships");
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

/** Card 5.4: the subsidiaries from 10-K Exhibit 21. A subsidiary is not listed, so it has no link. */
function SubsidiariesCard({
	relationships,
}: {
	relationships: RelationshipsSection;
}) {
	return (
		<CompanyCard
			tab="relationships"
			position={4}
			title="Owns: Subsidiaries"
			caption="Subsidiaries and the jurisdiction of each, from Exhibit 21 of the latest 10-K"
		>
			{relationships.subsidiaries.length === 0 ? (
				<p className="text-muted-foreground">The 10-K lists no subsidiary.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="sticky left-0 bg-card">
								Subsidiary
							</TableHead>
							<TableHead>Jurisdiction</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{relationships.subsidiaries.map((row, position) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: the section fixes the order of the rows, and Exhibit 21 can repeat a name
							<TableRow key={position}>
								<TableHead scope="row" className="sticky left-0 bg-card">
									{row.name}
								</TableHead>
								<ClaimCell claim={row.jurisdiction} />
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</CompanyCard>
	);
}

/** Card 5.5: the stakes in other listed companies, from the company's own 13F. */
function StakesCard({
	relationships,
	hasCompanyPage,
}: {
	relationships: RelationshipsSection;
	hasCompanyPage: (ticker: Ticker) => boolean;
}) {
	return (
		<CompanyCard
			tab="relationships"
			position={5}
			title="Owns: Stakes in Listed Companies"
			caption="Shares held, from the company's own 13F-HR, and the stake against the shares outstanding in each company's latest 10-Q or 10-K"
		>
			{relationships.stakes.length === 0 ? (
				<p className="text-muted-foreground">
					The 13F-HR lists no stake in a listed company.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="sticky left-0 bg-card">Company</TableHead>
							<TableHead className="text-right">Shares</TableHead>
							<TableHead className="text-right">Stake</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{relationships.stakes.map((row, position) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: the section fixes the order of the rows, and a stake can have no ticker
							<TableRow key={position}>
								<TableHead scope="row" className="sticky left-0 bg-card">
									{row.ticker !== null && hasCompanyPage(row.ticker) ? (
										<Link
											to={`/companies/${row.ticker.value}`}
											className="underline underline-offset-4 hover:text-primary"
										>
											{row.company}
										</Link>
									) : (
										row.company
									)}
								</TableHead>
								<FigureCell figure={row.sharesHeld} format={formatShares} />
								<FigureCell
									figure={stakePercent(relationships, position)}
									format={(value) => formatPercent(value * 100)}
								/>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</CompanyCard>
	);
}
