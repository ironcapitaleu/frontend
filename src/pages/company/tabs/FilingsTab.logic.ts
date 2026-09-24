import { MISSING } from "@/components/screener/format";
import { formatDate } from "@/lib/company/dates";
import {
	feedsOf,
	figureGroupsOf,
	isPrintedOnly,
	isSectorBenchmark,
} from "@/lib/company/sources";
import { COMPANY_TABS } from "@/lib/company/tabs";
import type {
	Claim,
	CompletedSections,
	Filing,
	FigureGroup,
	FigureGroupRef,
} from "@/lib/company/types";

/** One figure group that a filing feeds, and a claim of the group that reads the filing. */
export interface FedFigure {
	readonly ref: FigureGroupRef;
	/** The first claim of the group whose sources reach the filing. Its source card names the filing. */
	readonly claim: Claim;
}

/**
 * Returns the company figure groups of the six other tabs. Like the sources
 * index, it leaves out the sector groups and the groups only the printed page
 * draws, so no row names a peer filing or a figure the screen never shows.
 */
export function filingsGroupsOf(sections: CompletedSections): FigureGroup[] {
	return COMPANY_TABS.flatMap(({ key }) =>
		figureGroupsOf(key, sections),
	).filter(({ ref }) => !isSectorBenchmark(ref) && !isPrintedOnly(ref));
}

/**
 * Maps the accession number of each filing to the figures it feeds, one for
 * each group whose claims reach it, in the order of `groups`. `feedsOf` walks
 * each claim, so a derived figure feeds the filings of its inputs.
 */
export function fedFiguresOf(
	groups: readonly FigureGroup[],
): Map<string, FedFigure[]> {
	const fed = new Map<string, FedFigure[]>();
	for (const { ref, claims } of groups) {
		const reached = new Set<string>();
		for (const claim of claims) {
			for (const accession of feedsOf([{ ref, claims: [claim] }]).keys()) {
				if (reached.has(accession)) continue;
				reached.add(accession);
				fed.set(accession, [...(fed.get(accession) ?? []), { ref, claim }]);
			}
		}
	}
	return fed;
}

/** Writes a filing date as the page prints it, or the dash when it is not a real `YYYY-MM-DD` date. */
export function filedOnText(date: string): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	const valid =
		/^\d{4}-\d{2}-\d{2}$/.test(date) &&
		!Number.isNaN(parsed.getTime()) &&
		parsed.toISOString().startsWith(date);
	return valid ? formatDate(date as Filing["filedOn"]) : MISSING;
}
