import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router";

import { CompanyGatewayProvider } from "../../contexts/CompanyGatewayContext";
import type { CompanyGateway } from "../../lib/company/gateway";
import { alwaysFailingCompanyGateway } from "../../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../../test/fixtures/companies/always-found";
import { alwaysMissingCompanyGateway } from "../../test/fixtures/companies/always-missing";
import CompanyPage from "./CompanyPage";

/** A gateway that never answers, so the page stays in its loading state. */
const pending = (): Promise<never> => new Promise(() => {});
const neverAnsweringGateway: CompanyGateway = {
	getMasthead: pending,
	getOverview: pending,
	getFinancials: pending,
};
const foundGateway = alwaysFoundCompanyGateway();
const missingGateway = alwaysMissingCompanyGateway();
const failingGateway = alwaysFailingCompanyGateway();

/**
 * The company page shell: one state of the masthead load per story. Each story
 * sets the gateway and the URL in its `parameters`. The decorator mounts the
 * page on the two company routes, like `App`, and mirrors `Layout` (a
 * full-height flex column) so the centered states sit as in the running app.
 * The loaded state is a placeholder until the masthead and tab strip land.
 */
const meta: Meta<typeof CompanyPage> = {
	title: "Pages/CompanyPage",
	component: CompanyPage,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		companyGateway: foundGateway,
		path: "/companies/MRDN",
	},
	decorators: [
		(Story, { parameters }) => (
			<CompanyGatewayProvider gateway={parameters.companyGateway}>
				<MemoryRouter initialEntries={[parameters.path]}>
					<div className="min-h-screen flex flex-col">
						<Routes>
							<Route path="/companies/:symbol" element={<Story />} />
							<Route path="/companies/:symbol/:tab" element={<Story />} />
						</Routes>
					</div>
				</MemoryRouter>
			</CompanyGatewayProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof CompanyPage>;

/** The masthead is still loading. */
export const Loading: Story = {
	parameters: { companyGateway: neverAnsweringGateway },
};

/** The masthead loaded on the Overview route. */
export const Loaded: Story = {};

/** The masthead loaded on a tab route. */
export const LoadedOnTab: Story = {
	parameters: { path: "/companies/MRDN/financials" },
};

/** The gateway knows no company for the ticker. */
export const Missing: Story = {
	parameters: { companyGateway: missingGateway },
};

/** The symbol is not a valid ticker, so the page shows the missing state without a load. */
export const InvalidSymbol: Story = {
	parameters: { path: "/companies/MR..DN" },
};

/** The masthead request did not complete. */
export const Failed: Story = {
	parameters: { companyGateway: failingGateway },
};

/** The missing state at a phone width. */
export const MissingOnPhone: Story = {
	parameters: { companyGateway: missingGateway },
	globals: { viewport: { value: "mobile1", isRotated: false } },
};
