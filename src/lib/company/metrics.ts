import type { CompanySections, CompletedSections } from "./types";

/**
 * Brands the sections of the port as {@link CompletedSections}, so a tab can
 * read them. Returns a new object and leaves `sections` unchanged.
 *
 * The quarterly tables stay as the port returns them for now. A derived
 * quarter, such as the fourth quarter of revenue, reads `null` until
 * `completeQuarters` fills it in.
 */
export function completeSections(sections: CompanySections): CompletedSections {
	return { ...sections } as CompletedSections;
}
