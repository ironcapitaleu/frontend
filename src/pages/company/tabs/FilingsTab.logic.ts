import { feedsOf, figureGroupsOf, isOnScreen } from "@/lib/company/sources";
import { COMPANY_TABS } from "@/lib/company/tabs";
import type {
	Claim,
	CompletedSections,
	FigureGroup,
	FigureGroupRef,
	Filing,
	FilingForm,
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

/** The order of the chips. The record type makes the compiler ask for each new form. */
const FORM_ORDER: Record<FilingForm, number> = {
	"10-K": 0,
	"10-Q": 1,
	"8-K": 2,
	"DEF 14A": 3,
	"Form 4": 4,
	"13F-HR": 5,
};

/** One chip of card 7.1: a filing type and how many filings have it. */
export interface FormCount {
	readonly form: FilingForm;
	readonly count: number;
}

/**
 * Counts the filings of each type, in the order of `FORM_ORDER`. A type with
 * no filing gets no entry, so the card draws no chip for it.
 */
export function formCountsOf(filings: readonly Filing[]): FormCount[] {
	const counts = new Map<FilingForm, number>();
	for (const { form } of filings) counts.set(form, (counts.get(form) ?? 0) + 1);
	return [...counts]
		.map(([form, count]) => ({ form, count }))
		.sort((first, second) => FORM_ORDER[first.form] - FORM_ORDER[second.form]);
}

/**
 * Returns the filings of type `form`, or all of them when `form` is `null`.
 * It keeps the order of `filings`, so a list sorted newest first stays so.
 */
export function filingsOfForm(
	filings: readonly Filing[],
	form: FilingForm | null,
): readonly Filing[] {
	return form === null
		? filings
		: filings.filter((filing) => filing.form === form);
}
