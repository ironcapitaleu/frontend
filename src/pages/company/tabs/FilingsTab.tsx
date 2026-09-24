import { EmptyPanel } from "./EmptyPanel";

/** The Filings tab of the company page. It stays empty until its tab ticket fills it. */
export function FilingsTab() {
	return <EmptyPanel tab="filings" />;
}
