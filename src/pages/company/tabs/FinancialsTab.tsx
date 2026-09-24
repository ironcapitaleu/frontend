import { EmptyPanel } from "./EmptyPanel";

/** The Financials tab of the company page. It stays empty until its tab ticket fills it. */
export function FinancialsTab() {
	return <EmptyPanel tab="financials" />;
}
