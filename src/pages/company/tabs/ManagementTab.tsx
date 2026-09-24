import { EmptyPanel } from "./EmptyPanel";

/** The Management tab of the company page. It stays empty until its tab ticket fills it. */
export function ManagementTab() {
	return <EmptyPanel tab="management" />;
}
