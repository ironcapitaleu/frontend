import type { CompanyGateway } from "../../../lib/company/gateway";
import { fakeCompanyReport, fakeMasthead } from "./fake-company-report";

/**
 * A {@link CompanyGateway} fake that finds a company for every ticker. Each
 * method resolves the matching section of {@link fakeCompanyReport}.
 * `getMasthead` sets the masthead `ticker` and listing to the ticker it gets,
 * so a test can check which ticker reached the gateway. Use it to arrange the
 * loaded state.
 */
export function alwaysFoundCompanyGateway(): CompanyGateway {
	return {
		getMasthead: async (ticker) => fakeMasthead(ticker),
		getOverview: async () => fakeCompanyReport.overview,
		getFinancials: async () => fakeCompanyReport.financials,
	};
}
