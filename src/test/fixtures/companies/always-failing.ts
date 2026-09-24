import { FailedCompanyRequest } from "../../../lib/company/errors";
import type { CompanyGateway } from "../../../lib/company/gateway";

/**
 * A {@link CompanyGateway} fake where every load fails, as if the company data
 * service were unreachable. Each method rejects with
 * {@link FailedCompanyRequest}. Use it to arrange the failed state.
 */
export function alwaysFailingCompanyGateway(): CompanyGateway {
	const reject = async (): Promise<never> => {
		throw new FailedCompanyRequest();
	};
	return {
		getMasthead: reject,
		getOverview: reject,
		getFinancials: reject,
		getValuation: reject,
		getShareholderReturns: reject,
		getRelationships: reject,
		getManagement: reject,
		getFilings: reject,
	};
}
