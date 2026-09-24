import type { Filing, FilingsSection } from "../types";
import { meridianFinancials } from "./financials";
import { meridianManagement } from "./management";
import { meridianMasthead } from "./masthead";
import { meridianOverview } from "./overview";
import { meridianRelationships } from "./relationships";
import { meridianShareholderReturns } from "./shareholderReturns";
import { MERIDIAN } from "./sources";
import { meridianValuation } from "./valuation";

function isFiling(value: object): value is Filing {
	return "kind" in value && value.kind === "filing";
}

/** Collects the filing of every reported source under `value`, walking into derived inputs. */
function filingsUnder(value: unknown): Filing[] {
	if (value === null || typeof value !== "object") {
		return [];
	}
	if (isFiling(value)) {
		return [value];
	}
	return Object.values(value).flatMap(filingsUnder);
}

/**
 * Tells whether a filing reports on another company: a 10-K or 10-Q that a
 * peer or a stake company filed. The Filings tab lists the filings about
 * Meridian only. A 13F-HR or a Form 4 that another filer filed reports its
 * holding of Meridian, so it stays on the list.
 */
function isAboutAnotherCompany(filing: Filing): boolean {
	return (
		(filing.form === "10-K" || filing.form === "10-Q") &&
		filing.filer !== MERIDIAN
	);
}

/**
 * The Filings data of Meridian: every filing that a claim of the other
 * sections reads, apart from the filings about other companies, newest first.
 * The list comes from the claims, so it cannot name a filing that no figure
 * reads, nor miss one that a figure reads.
 */
export const meridianFilingsSection: FilingsSection = {
	filings: [
		...new Map(
			filingsUnder([
				meridianMasthead,
				meridianOverview,
				meridianFinancials,
				meridianValuation,
				meridianShareholderReturns,
				meridianRelationships,
				meridianManagement,
			])
				.filter((filing) => !isAboutAnotherCompany(filing))
				.map((filing) => [filing.accessionNumber, filing]),
		).values(),
	].sort(
		(first, second) =>
			second.filedOn.localeCompare(first.filedOn) ||
			second.accessionNumber.localeCompare(first.accessionNumber),
	),
};
