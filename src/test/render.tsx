import { render as rtlRender } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { AuthProvider } from "../contexts/AuthContext";
import type { AuthGateway } from "../lib/auth/gateway";
import { alwaysUnauthenticatedAuth } from "./fixtures/auth/always-unauthenticated";

interface RenderOptions {
	/** The auth world to arrange; defaults to signed-out. */
	gateway?: AuthGateway;
	/** Initial router history entries; defaults to the home route. */
	initialEntries?: string[];
}

/**
 * Renders `ui` inside the app's real provider tree — `AuthProvider` (with an
 * injected {@link AuthGateway}) and a `MemoryRouter` — so unit and integration
 * tests exercise auth and routing exactly as production does.
 *
 * Pass `gateway` to arrange the auth world and `initialEntries` to place the
 * router on the route under test. Re-exports everything from
 * `@testing-library/react`, so a test imports `render`, `screen`, etc. from here.
 */
export function render(
	ui: ReactElement,
	{
		gateway = alwaysUnauthenticatedAuth(),
		initialEntries = ["/"],
	}: RenderOptions = {},
) {
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<AuthProvider gateway={gateway}>
				<MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
			</AuthProvider>
		);
	}

	return rtlRender(ui, { wrapper: Wrapper });
}

export * from "@testing-library/react";
