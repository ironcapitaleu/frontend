import { render as rtlRender } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { AuthProvider } from "../contexts/AuthContext";
import { CompanyGatewayProvider } from "../contexts/CompanyGatewayContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import type { AuthGateway } from "../lib/auth/gateway";
import type { CompanyGateway } from "../lib/company/gateway";
import { alwaysUnauthenticatedAuth } from "./fixtures/auth/always-unauthenticated";
import { alwaysFoundCompanyGateway } from "./fixtures/companies/always-found";

interface RenderOptions {
	/** The auth world to arrange; defaults to signed-out. */
	gateway?: AuthGateway;
	/** The company data world to arrange; defaults to a gateway that finds every company. */
	companyGateway?: CompanyGateway;
	/** Initial router history entries; defaults to the home route. */
	initialEntries?: string[];
}

/**
 * Renders `ui` inside the app's real provider tree — `AuthProvider` (with an
 * injected {@link AuthGateway}), `CompanyGatewayProvider` (with an injected
 * {@link CompanyGateway}) and a `MemoryRouter` — so unit and integration tests
 * exercise auth, company data and routing exactly as production does.
 *
 * Pass `gateway` to arrange the auth world, `companyGateway` to arrange the
 * company data, and `initialEntries` to place the router on the route under
 * test. Re-exports everything from
 * `@testing-library/react`, so a test imports `render`, `screen`, etc. from here.
 */
export function render(
	ui: ReactElement,
	{
		gateway = alwaysUnauthenticatedAuth(),
		companyGateway = alwaysFoundCompanyGateway(),
		initialEntries = ["/"],
	}: RenderOptions = {},
) {
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<ThemeProvider>
				<AuthProvider gateway={gateway}>
					<CompanyGatewayProvider gateway={companyGateway}>
						<MemoryRouter initialEntries={initialEntries}>
							{children}
						</MemoryRouter>
					</CompanyGatewayProvider>
				</AuthProvider>
			</ThemeProvider>
		);
	}

	return rtlRender(ui, { wrapper: Wrapper });
}

export * from "@testing-library/react";
