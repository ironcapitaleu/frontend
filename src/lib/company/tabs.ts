import type { Assert, SameMembers } from "../types";
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
export const COMPANY_TABS = [
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
] as const satisfies readonly CompanyTab[];

// Fails the type check when `COMPANY_TABS` misses a `TabKey` or names one that does not exist.
export type TabKeysListed = Assert<
	SameMembers<TabKey, (typeof COMPANY_TABS)[number]["key"]>
>;

/**
 * Finds the tab for the `:tab` part of a company page URL. No segment means
 * Overview. The match ignores case, and the segment `overview` also names
 * Overview. The page redirects such a segment to the tab's own URL, so
 * compare the result's `segment` with the input to tell the two apart.
 *
 * @returns the tab, or `null` when no tab has this segment.
 */
export function findTab(segment: string | undefined): CompanyTab | null {
	const lowered = segment?.toLowerCase() ?? null;
	const wanted = lowered === "overview" ? null : lowered;
	return COMPANY_TABS.find((tab) => tab.segment === wanted) ?? null;
}

/**
 * Builds the URL of one tab of a company page, such as
 * `/companies/MRDN/returns`. Overview has no segment, so its URL is
 * `/companies/MRDN`. The tab strip links with it, and the page redirects to it.
 */
export function tabPath(symbol: string, tab: CompanyTab): string {
	const base = `/companies/${symbol}`;
	return tab.segment === null ? base : `${base}/${tab.segment}`;
}
