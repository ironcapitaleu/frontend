import { useEffect, useState } from "react";

import { useCompanyGateway } from "../contexts/CompanyGatewayContext";
import { MissingCompany } from "../lib/company/errors";
import type { CompanyGateway } from "../lib/company/gateway";
import { completeSections } from "../lib/company/metrics";
import type { CompanySections, CompletedSections } from "../lib/company/types";
import { Ticker } from "../lib/domain/ticker";

/** Names one section that the port returns, such as `overview`. */
export type CompanySectionKey = keyof CompanySections;

/** The data of one section after it loaded. */
export type SectionData<K extends CompanySectionKey> = NonNullable<
	CompanySections[K]
>;

/** The state of one section load. `useCompany` returns it. */
export type CompanyState<K extends CompanySectionKey> =
	| { readonly status: "loading" }
	| {
			readonly status: "loaded";
			/** The section, with its quarterly tables completed. */
			readonly data: SectionData<K>;
			/** The completed sections that the metric functions take. Only `data` is not `null`. */
			readonly sections: CompletedSections;
	  }
	| { readonly status: "missing"; readonly error: MissingCompany }
	| { readonly status: "failed"; readonly error: unknown };

const loaders: {
	[K in CompanySectionKey]: (
		gateway: CompanyGateway,
		ticker: Ticker,
	) => Promise<SectionData<K>>;
} = {
	masthead: (gateway, ticker) => gateway.getMasthead(ticker),
	overview: (gateway, ticker) => gateway.getOverview(ticker),
	financials: (gateway, ticker) => gateway.getFinancials(ticker),
};

const noSections: CompanySections = {
	masthead: null,
	overview: null,
	financials: null,
};

/** A finished load, with the gateway, symbol and section that started it. */
interface Settled<K extends CompanySectionKey> {
	readonly gateway: CompanyGateway;
	readonly symbol: string;
	readonly section: K;
	readonly state: CompanyState<K>;
}

function settle<K extends CompanySectionKey>(
	section: K,
	outcome: { data: SectionData<K> } | { error: unknown },
): CompanyState<K> {
	if ("data" in outcome) {
		const sections = completeSections({
			...noSections,
			[section]: outcome.data,
		});
		return {
			status: "loaded",
			data: sections[section] as SectionData<K>,
			sections,
		};
	}
	// `getMasthead` decides the missing state. After the masthead loaded, a
	// tab section that rejects with `MissingCompany` is an adapter defect.
	if (outcome.error instanceof MissingCompany && section === "masthead") {
		return { status: "missing", error: outcome.error };
	}
	return { status: "failed", error: outcome.error };
}

/**
 * Loads one section of a company from the gateway of the nearest
 * `CompanyGatewayProvider`, and returns the state of the load.
 *
 * The state has one of four statuses:
 * - `loading` until the gateway answers.
 * - `loaded` with the section in `data`, after `completeSections` completed it.
 * - `missing` with the `MissingCompany` error, when `getMasthead` knows no
 *   company for the ticker.
 * - `failed` with the error from the gateway, for every other error. A tab
 *   section that rejects with `MissingCompany` also gives `failed`, because
 *   the masthead decides the missing state.
 *
 * The hook ties each load to the symbol in `ticker.value`. When the symbol or
 * the section changes, the state returns to `loading` and the hook calls the
 * gateway again. A new `Ticker` instance with the same symbol starts no new
 * load. The hook ignores a result that arrives after the symbol changed or
 * after the component unmounted.
 *
 * @throws Error when used outside a `CompanyGatewayProvider`.
 */
export function useCompany<K extends CompanySectionKey>(
	ticker: Ticker,
	section: K,
): CompanyState<K> {
	const gateway = useCompanyGateway();
	const symbol = ticker.value;
	const [settled, setSettled] = useState<Settled<K> | null>(null);

	useEffect(() => {
		let current = true;
		const finish = (outcome: { data: SectionData<K> } | { error: unknown }) => {
			if (current) {
				setSettled({
					gateway,
					symbol,
					section,
					state: settle(section, outcome),
				});
			}
		};
		loaders[section](gateway, Ticker.parse(symbol)).then(
			(data) => finish({ data }),
			(error: unknown) => finish({ error }),
		);
		return () => {
			current = false;
		};
	}, [gateway, symbol, section]);

	const isCurrent =
		settled !== null &&
		settled.gateway === gateway &&
		settled.symbol === symbol &&
		settled.section === section;
	return isCurrent ? settled.state : { status: "loading" };
}
