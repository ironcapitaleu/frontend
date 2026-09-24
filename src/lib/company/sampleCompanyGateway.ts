import type { Ticker } from "../domain/ticker";
import { MissingCompany } from "./errors";
import type { CompanyGateway } from "./gateway";
import { meridianFinancials } from "./sample/financials";
import { MERIDIAN_TICKER, meridianMasthead } from "./sample/masthead";
import { meridianOverview } from "./sample/overview";

/**
 * The sample {@link CompanyGateway} adapter. It serves made-up data for one
 * company, Meridian Semiconductor, under the ticker `MRDN`, until the backend
 * adapter exists. `CompanyGatewayProvider` uses it as its default gateway, so
 * the running app serves it, as `DESIGN.md` §8 plans.
 *
 * Each method resolves the MRDN section for `MRDN`. For any other ticker, it
 * rejects with {@link MissingCompany}. The data lives in `sample/`.
 */
export function sampleCompanyGateway(): CompanyGateway {
	const serve =
		<Section>(section: Section) =>
		async (ticker: Ticker): Promise<Section> => {
			if (!ticker.equals(MERIDIAN_TICKER)) {
				throw new MissingCompany(ticker);
			}
			return section;
		};
	return {
		getMasthead: serve(meridianMasthead),
		getOverview: serve(meridianOverview),
		getFinancials: serve(meridianFinancials),
	};
}
