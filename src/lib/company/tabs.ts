import type { TabKey } from "./types";

/** One tab of the company page, with its URL segment and its label. */
export interface CompanyTab {
	readonly key: TabKey;
	/** The last part of the tab's URL, or `null` for Overview at `/companies/:symbol`. */
	readonly segment: string | null;
	readonly label: string;
}

/**
 * The seven tabs of the company page, in the order of the tab strip. The list
 * copies the URL table in DESIGN.md §8. A change to the order is a design
 * change, because it renumbers every card title.
 */
export const COMPANY_TABS: readonly CompanyTab[] = [
	{ key: "overview", segment: null, label: "Overview" },
	{ key: "financials", segment: "financials", label: "Financials" },
	{ key: "valuation", segment: "valuation", label: "Valuation" },
	{
		key: "shareholderReturns",
		segment: "returns",
		label: "Shareholder returns",
	},
	{ key: "relationships", segment: "relationships", label: "Relationships" },
	{ key: "management", segment: "management", label: "Management" },
	{ key: "filings", segment: "filings", label: "Filings" },
];

/**
 * Finds the tab for the `:tab` part of a company page URL. No segment means
 * Overview.
 *
 * @returns the tab, or `null` when no tab has this segment.
 */
export function findTab(segment: string | undefined): CompanyTab | null {
	const wanted = segment ?? null;
	return COMPANY_TABS.find((tab) => tab.segment === wanted) ?? null;
}
