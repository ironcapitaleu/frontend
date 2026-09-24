import { EmptyPanel } from "./EmptyPanel";

/** The Overview tab of the company page. It stays empty until its tab ticket fills it. */
export function OverviewTab() {
	return <EmptyPanel tab="overview" />;
}
