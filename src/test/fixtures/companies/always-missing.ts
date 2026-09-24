import { MissingCompany } from "../../../lib/company/errors";
import type { CompanyGateway } from "../../../lib/company/gateway";
import type { Ticker } from "../../../lib/domain/ticker";

/**
 * A {@link CompanyGateway} fake that knows no company. Each method rejects
 * with {@link MissingCompany} for the ticker it gets. Use it to arrange the
 * missing state.
 */
export function alwaysMissingCompanyGateway(): CompanyGateway {
	const reject = async (ticker: Ticker): Promise<never> => {
		throw new MissingCompany(ticker);
	};
	return {
		getMasthead: reject,
		getOverview: reject,
		getFinancials: reject,
	};
}
