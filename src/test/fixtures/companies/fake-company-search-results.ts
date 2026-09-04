import type { CompanyResult } from "../../../pages/CompanySearch";

/**
 * A fixed, deliberately-shaped set of companies for CompanySearch tests. Its
 * rows are chosen so search and selection can be asserted against known data
 * rather than against whatever list the page happens to ship:
 *
 * - symbols and names are distinct, so a query matches exactly one row;
 * - Alfa and Crux carry a `website`; Bravo omits it, exercising the
 *   conditional "Visit Website" link;
 * - Bravo also omits `employees` and `founded`, exercising the optional metrics.
 *
 * Inject it with `<CompanySearch companies={fakeCompanySearchResults} />` so a
 * test owns its data and stays green when the shipped placeholder list changes.
 */
export const fakeCompanySearchResults: readonly CompanyResult[] = [
	{
		symbol: "ALFA",
		name: "Alfa Aviation",
		description: "Alfa Aviation builds regional aircraft and avionics systems.",
		sector: "Industrials",
		industry: "Aerospace & Defense",
		marketCap: 3_000_000_000_000,
		employees: 120_000,
		founded: 1971,
		headquarters: "Toulouse, France",
		website: "https://www.alfa-aviation.example",
	},
	{
		symbol: "BRVO",
		name: "Bravo Biotech",
		description: "Bravo Biotech develops gene therapies for rare diseases.",
		sector: "Healthcare",
		industry: "Biotechnology",
		marketCap: 9_000_000_000,
		headquarters: "Basel, Switzerland",
	},
	{
		symbol: "CRUX",
		name: "Crux Systems",
		description: "Crux Systems designs industrial control software.",
		sector: "Technology",
		industry: "Software",
		marketCap: 500_000_000,
		employees: 4_200,
		founded: 2004,
		headquarters: "Austin, Texas",
		website: "https://www.crux-systems.example",
	},
];
