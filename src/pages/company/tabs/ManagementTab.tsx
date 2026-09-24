import * as React from "react";

import { CompanyCard, CompanyCardGrid } from "@/components/company/CompanyCard";
import { SourceTrigger } from "@/components/company/SourceCard";
import { SourcesIndex } from "@/components/company/SourcesIndex";
import { MISSING, MISSING_INK } from "@/components/screener/format";
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
import { tenure } from "../../../lib/company/metrics";
import { figureGroupsOf } from "../../../lib/company/sources";
import type {
	BlockKey,
	CompletedSections,
	ManagementSection,
} from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
import { FigureCell } from "./FigureCell";

/** The blocks this tab draws so far. The other cards come in later tickets. */
const DRAWN_BLOCKS: ReadonlySet<BlockKey> = new Set(["executivesAndBoard"]);

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

/** Card 6.1, the executives and directors, then the sources index. */
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
										<TableCell>
											{row.independence !== null ? (
												<SourceTrigger claim={row.independence}>
													{row.independence.value}
												</SourceTrigger>
											) : (
												<span className={MISSING_INK}>{MISSING}</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CompanyCard>
			</CompanyCardGrid>
			<SourcesIndex groups={groups} />
		</div>
	);
}
