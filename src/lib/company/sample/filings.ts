import type { Filing, FilingsSection } from "../types";
import { meridianFinancials } from "./financials";
import { meridianManagement } from "./management";
import { meridianMasthead } from "./masthead";
import { meridianOverview } from "./overview";
import { meridianRelationships } from "./relationships";
import { meridianShareholderReturns } from "./shareholderReturns";
import { meridianValuation } from "./valuation";

function isFiling(value: object): value is Filing {
	return "kind" in value && value.kind === "filing";
}

/**
 * Collects the filing of every reported source under `value`, walking into
 * derived inputs. It skips the `sectorBenchmarks` lists, as the Filings walk
 * skips the sector figures (`isSectorBenchmark`), so it never collects a peer
 * filing.
 */
function filingsUnder(value: unknown): Filing[] {
	if (value === null || typeof value !== "object") {
		return [];
	}
	if (isFiling(value)) {
		return [value];
	}
	return Object.entries(value).flatMap(([key, child]) =>
		key === "sectorBenchmarks" ? [] : filingsUnder(child),
	);
}

/**
 * The Filings data of Meridian: every filing that a company claim of the
 * other sections reads, newest first. That includes the 10-Qs that the stake
 * companies filed, the Form 4s of the insiders and the 13F-HRs of the funds.
 * It leaves out the peer filings behind the sector benchmarks. The list comes
 * from the claims, so it cannot name a filing that no figure reads, nor miss
 * one that a figure reads.
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
			]).map((filing) => [filing.accessionNumber, filing]),
		).values(),
	].sort(
		(first, second) =>
			second.filedOn.localeCompare(first.filedOn) ||
			second.accessionNumber.localeCompare(first.accessionNumber),
	),
};
