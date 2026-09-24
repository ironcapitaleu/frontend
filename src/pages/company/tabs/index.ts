import type { ComponentType } from "react";

import type { TabKey } from "../../../lib/company/types";
import type { Ticker } from "../../../lib/domain/ticker";
// The panels are imported in the order of the tab strip, not alphabetically,
// so the list reads like the page.
import { OverviewTab } from "./OverviewTab";
import { FinancialsTab } from "./FinancialsTab";
import { ValuationTab } from "./ValuationTab";
import { ShareholderReturnsTab } from "./ShareholderReturnsTab";
import { RelationshipsTab } from "./RelationshipsTab";
import { ManagementTab } from "./ManagementTab";
import { FilingsTab } from "./FilingsTab";

/**
 * The panel of each tab of the company page. `CompanyPage` renders the panel
 * of the active tab below the tab strip. Each panel lives in its own file, so
 * each tab ticket edits its own file alone.
 */
export const TAB_PANELS: Record<TabKey, ComponentType<{ ticker: Ticker }>> = {
	overview: OverviewTab,
	financials: FinancialsTab,
	valuation: ValuationTab,
	shareholderReturns: ShareholderReturnsTab,
	relationships: RelationshipsTab,
	management: ManagementTab,
	filings: FilingsTab,
};
