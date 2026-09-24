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
 *
 * Pass the same gateway object on every render. `useCompany` ties each load
 * to the gateway instance, so a new instance starts every load under this
 * provider again. Create the gateway once, at module scope, the way
 * `AuthContext.tsx` creates its default gateway. Do not call a gateway factory
 * inline in JSX.
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
 * @throws Error when used outside a `CompanyGatewayProvider`. Every consumer
 * must sit under the provider.
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
