import { createContext, useContext, type ReactNode } from "react";

import type { CompanyGateway } from "../lib/company/gateway";
import { sampleCompanyGateway } from "../lib/company/sampleCompanyGateway";

const CompanyGatewayContext = createContext<CompanyGateway | undefined>(
	undefined,
);

/**
 * The default gateway, which serves the sample MRDN data until a backend
 * adapter exists. The module creates it once, so its identity stays the same
 * across renders and `useCompany` starts no extra load. Tests inject their own
 * fake through the `gateway` prop.
 */
const defaultGateway = sampleCompanyGateway();

/**
 * Gives its subtree one {@link CompanyGateway}. Each tab reads its company data
 * from this gateway through `useCompany`.
 *
 * Why the `gateway` prop? The page depends on the port and not on an adapter.
 * A test passes a named fake, so no test needs `vi.mock`. A later backend
 * adapter replaces the sample adapter without a change to any tab. Without the
 * prop, the provider uses the sample adapter.
 *
 * Pass the same gateway object on every render. `useCompany` ties each load
 * to the gateway instance, so a new instance starts every load under this
 * provider again. Create the gateway once, at module scope, the way
 * `AuthContext.tsx` creates its default gateway. Do not call a gateway factory
 * inline in JSX.
 */
export function CompanyGatewayProvider({
	children,
	gateway = defaultGateway,
}: {
	children: ReactNode;
	gateway?: CompanyGateway;
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
