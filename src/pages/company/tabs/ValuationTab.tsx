import { EmptyPanel } from "./EmptyPanel";

/** The Valuation tab of the company page. It stays empty until its tab ticket fills it. */
export function ValuationTab() {
	return <EmptyPanel tab="valuation" />;
}
