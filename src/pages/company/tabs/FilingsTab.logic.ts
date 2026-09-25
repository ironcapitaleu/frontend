import { feedsOf, figureGroupsOf, isOnScreen } from "@/lib/company/sources";
import { COMPANY_TABS } from "@/lib/company/tabs";
import type {
	Claim,
	CompletedSections,
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
 * index, it keeps only the groups `isOnScreen` keeps, so no row names a peer
 * filing or a card the screen does not draw.
 */
export function filingsGroupsOf(sections: CompletedSections): FigureGroup[] {
	return COMPANY_TABS.flatMap(({ key }) =>
		figureGroupsOf(key, sections),
	).filter(({ ref }) => isOnScreen(ref));
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
