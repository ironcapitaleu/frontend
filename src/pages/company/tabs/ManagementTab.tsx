import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { ShareBar } from "@/components/company/ShareBar";
import { SourcesChip } from "@/components/company/SourcesChip";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import { MISSING, toFixedWithMinus } from "@/components/screener/format";
import { Button } from "@/components/ui/button";
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
import { payMix, tenure } from "../../../lib/company/metrics";
import { figureGroupsOf } from "../../../lib/company/sources";
import type {
	BlockKey,
	Claim,
	ClaimValue,
	CompletedSections,
	ManagementSection,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { ClaimCell, FigureCell } from "./FigureCell";
import type { BarTable } from "./financialsTable";
import { InsiderTable } from "./InsiderTable";
import { BarChart } from "./StatementChart";

/** The blocks this tab draws so far. The other cards come in later tickets. */
const DRAWN_BLOCKS: ReadonlySet<BlockKey> = new Set([
	"executivesAndBoard",
	"ceoPay",
	"payMix",
	"insiderHoldings",
]);

/**
 * The Management tab of the company page (DESIGN.md §8 "Management"). It
 * loads the Management section and shows its cards, then the sources index.
 */
export function ManagementTab({ ticker }: { ticker: Ticker }) {
	const state = useCompany(ticker, "management");

	switch (state.status) {
		case "loading":
			return (
				<div className="flex justify-center py-16">
					<Spinner size="lg" label="Loading management" />
				</div>
			);
		case "missing":
		case "failed":
			return (
				<Text font="sans" size="lg" className="text-left">
					The management data did not load. Something went wrong on our side.
					Try again in a moment.
				</Text>
			);
		case "loaded":
			return (
				<LoadedManagement management={state.data} sections={state.sections} />
			);
	}
}

/** The parts of the chief executive's pay, in the order card 6.3 names them. */
const PAY_PARTS = [
	["salary", "Salary"],
	["bonus", "Bonus"],
	["stockAwards", "Stock"],
	["other", "Other"],
] as const;

/**
 * Card 6.1, the executives and directors, card 6.2, the chief executive's pay
 * by year, then row 3: card 6.3 Pay Mix and card 6.4 Insider Holdings. Then
 * the sources index.
 */
function LoadedManagement({
	management,
	sections,
}: {
	management: ManagementSection;
	sections: CompletedSections;
}) {
	// The same `groups` on each render lets `SourcesIndex` keep its memo.
	const groups = React.useMemo(
		() =>
			figureGroupsOf("management", sections).filter(({ ref }) =>
				DRAWN_BLOCKS.has(ref.block),
			),
		[sections],
	);
	return (
		<div className="flex flex-col gap-10">
			<CompanyCardGrid>
				<CompanyCard
					tab="management"
					position={1}
					title="Executives and Board"
					caption="Role, whole years in the role up to the filing date, and board independence, from the latest DEF 14A"
					span={2}
				>
					{management.people.length === 0 ? (
						<p className="text-muted-foreground">
							The proxy statement lists no executive or director.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="sticky left-0 bg-card">Name</TableHead>
									<TableHead>Role</TableHead>
									<TableHead className="text-right">Tenure in years</TableHead>
									<TableHead>Independence</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{management.people.map((row, position) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: the section fixes the order of the rows, and two people can share a name
									<TableRow key={position}>
										<TableHead scope="row" className="sticky left-0 bg-card">
											{row.name}
										</TableHead>
										<TableCell>{row.role}</TableCell>
										<FigureCell
											figure={tenure(management, position)}
											format={String}
										/>
										<ClaimCell claim={row.independence} />
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CompanyCard>
				<CeoPayCard
					management={management}
					claims={
						groups.find(({ ref }) => ref.block === "ceoPay")?.claims ?? []
					}
				/>
				<PayMixCard management={management} />
				<CompanyCard
					tab="management"
					position={4}
					title="Insider Holdings"
					caption="Shares held by each officer and director, from their latest Form 4"
				>
					<InsiderTable insiders={management.insiders} />
				</CompanyCard>
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}

/** Card 6.3: each part of the chief executive's pay in the latest year, as a share of the whole. */
function PayMixCard({ management }: { management: ManagementSection }) {
	const year = management.ceoPay.at(-1);
	const mix = payMix(management);
	const period = Number.isInteger(year?.fiscalYear)
		? ` in FY${year?.fiscalYear}`
		: "";
	return (
		<CompanyCard
			tab="management"
			position={3}
			title="Pay Mix"
			caption={`Share of the chief executive's pay${period}, from the summary compensation table of the DEF 14A`}
		>
			{year === undefined ? (
				<p className="text-muted-foreground">
					The proxy statement reports no pay for the chief executive.
				</p>
			) : (
				<ShareBar
					aria-label="Pay mix"
					parts={PAY_PARTS.map(([key, label]) => ({
						label,
						share: mix[key],
					}))}
				/>
			)}
		</CompanyCard>
	);
}

/** Writes a pay figure in USD thousands, such as `7,200`, or the dash when it is not a finite number. */
function formatPay(value: ClaimValue): string {
	return typeof value === "number" && Number.isFinite(value)
		? toFixedWithMinus(value / 1e3, 0, true)
		: MISSING;
}

/** Writes a fiscal year in full, `FY2026`, or short, `FY26`, or the dash when it is not a whole number. */
function yearLabel(fiscalYear: number, full: boolean): string {
	if (!Number.isInteger(fiscalYear)) return MISSING;
	return `FY${full ? fiscalYear : String(fiscalYear).slice(-2)}`;
}

/**
 * Card 6.2: the chief executive's pay in each year, stacked by part. "Data"
 * swaps the chart for a table. With no pay, the card shows only its sources.
 */
function CeoPayCard({
	management,
	claims,
}: {
	management: ManagementSection;
	claims: readonly Claim[];
}) {
	const [data, setData] = React.useState(false);
	const { ceoPay } = management;
	const table: BarTable = {
		// A year can repeat or be missing, so a column keys on its position.
		columns: ceoPay.map(({ fiscalYear }, position) => ({
			key: String(position),
			label: yearLabel(fiscalYear, true),
			short: yearLabel(fiscalYear, false),
		})),
		lines: PAY_PARTS.map(([key, label]) => ({
			key,
			label,
			points: ceoPay.map((year) => year[key]),
		})),
	};
	const [first, last] = [table.columns[0], table.columns.at(-1)];
	return (
		<CompanyCard
			tab="management"
			position={2}
			title="CEO Pay by Year"
			caption={`${first?.label ?? MISSING}–${last?.label ?? MISSING} · USD thousands · Summary compensation table of each year's DEF 14A`}
			span={2}
			className="min-w-0"
			actions={
				<>
					{ceoPay.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							aria-pressed={data}
							onClick={() => setData(!data)}
						>
							Data
						</Button>
					)}
					<SourcesChip claims={claims} />
				</>
			}
		>
			{ceoPay.length === 0 ? (
				<p className="text-muted-foreground">
					The proxy statement reports no pay for the chief executive.
				</p>
			) : data ? (
				<Table aria-label="CEO pay by year">
					<TableHeader>
						<TableRow>
							<TableHead className="sticky left-0 bg-card">Year</TableHead>
							{PAY_PARTS.map(([key, label]) => (
								<TableHead key={key} className="text-right">
									{label}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{ceoPay.map((year, position) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: a year can repeat or be missing, and the rows keep their order
							<TableRow key={position}>
								<TableHead scope="row" className="sticky left-0 bg-card">
									{yearLabel(year.fiscalYear, true)}
								</TableHead>
								{PAY_PARTS.map(([key]) => (
									<FigureCell key={key} figure={year[key]} format={formatPay} />
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<BarChart
					table={table}
					format={(claim) => formatPay(claim.value)}
					stacked
				/>
			)}
		</CompanyCard>
	);
}
