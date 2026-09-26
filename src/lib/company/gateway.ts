import type { Ticker } from "../domain/ticker";
import type { FailedCompanyRequest, MissingCompany } from "./errors";
import type {
	FilingsSection,
	FinancialsSection,
	ManagementSection,
	MastheadSection,
	OverviewSection,
	RelationshipsSection,
	ShareholderReturnsSection,
	ValuationSection,
} from "./types";

/**
 * The app's port for company data: one method for each section of the company
 * page, in the app's own vocabulary.
 *
 * Why a port? The page and its tests depend on this interface alone. A sample
 * adapter serves made-up data behind it today, and a backend adapter replaces
 * it later without a change to the page. Test fakes
 * (`always{Behaviour}CompanyGateway`) implement the same interface with fixed
 * behaviour.
 *
 * Each method rejects its promise with {@link MissingCompany} when the adapter
 * knows no company for the ticker, and with {@link FailedCompanyRequest} when
 * the load did not complete. No method returns a result object.
 */
export interface CompanyGateway {
	/**
	 * Resolves the masthead of the company.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getMasthead(ticker: Ticker): Promise<MastheadSection>;
	/**
	 * Resolves the data of the Overview tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getOverview(ticker: Ticker): Promise<OverviewSection>;
	/**
	 * Resolves the three statements of the Financials tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getFinancials(ticker: Ticker): Promise<FinancialsSection>;
	/**
	 * Resolves the Treasury yields and the sector benchmarks of the Valuation tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getValuation(ticker: Ticker): Promise<ValuationSection>;
	/**
	 * Resolves the dividends and share counts of the Shareholder returns tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getShareholderReturns(ticker: Ticker): Promise<ShareholderReturnsSection>;
	/**
	 * Resolves the holders, subsidiaries and stakes of the Relationships tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getRelationships(ticker: Ticker): Promise<RelationshipsSection>;
	/**
	 * Resolves the people, pay and insider trades of the Management tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getManagement(ticker: Ticker): Promise<ManagementSection>;
	/**
	 * Resolves the filings that the page reads, for the Filings tab.
	 *
	 * @throws MissingCompany when the adapter knows no company for the ticker.
	 * @throws FailedCompanyRequest when the load did not complete.
	 */
	getFilings(ticker: Ticker): Promise<FilingsSection>;
}
