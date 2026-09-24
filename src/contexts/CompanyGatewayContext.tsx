import { createContext, useContext, type ReactNode } from "react";

import type { CompanyGateway } from "../lib/company/gateway";

const CompanyGatewayContext = createContext<CompanyGateway | undefined>(
	undefined,
);

/**
 * Gives its subtree one {@link CompanyGateway}. Each tab reads its company data
 * from this gateway through `useCompany`.
 *
 * Why the `gateway` prop? The page depends on the port and not on an adapter.
 * A test passes a named fake, so no test needs `vi.mock`. A later backend
 * adapter replaces the sample adapter without a change to any tab.
 */
export function CompanyGatewayProvider({
	children,
	gateway,
}: {
	children: ReactNode;
	gateway: CompanyGateway;
}) {
	return (
		<CompanyGatewayContext.Provider value={gateway}>
			{children}
		</CompanyGatewayContext.Provider>
	);
}

/**
 * Returns the gateway of the nearest {@link CompanyGatewayProvider}.
 *
 * Throws an `Error` when used outside a `CompanyGatewayProvider`. Every
 * consumer must be rendered inside one.
 */
export function useCompanyGateway(): CompanyGateway {
	const gateway = useContext(CompanyGatewayContext);
	if (gateway === undefined) {
		throw new Error(
			"useCompanyGateway must be used within a CompanyGatewayProvider",
		);
	}
	return gateway;
}
