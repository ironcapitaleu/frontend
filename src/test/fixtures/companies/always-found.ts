import type { CompanyGateway } from "../../../lib/company/gateway";
import { fakeCompanyReport } from "./fake-company-report";

/**
 * A {@link CompanyGateway} fake that finds a company for every ticker. Each
 * method resolves the matching section of {@link fakeCompanyReport}. Use it to
 * arrange the loaded state.
 */
export function alwaysFoundCompanyGateway(): CompanyGateway {
	return {
		getMasthead: async () => fakeCompanyReport.masthead,
		getOverview: async () => fakeCompanyReport.overview,
		getFinancials: async () => fakeCompanyReport.financials,
	};
}
