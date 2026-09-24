import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useCompany } from "../../hooks/useCompany";
import { type CompanyTab, findTab } from "../../lib/company/tabs";
import { Ticker } from "../../lib/domain/ticker";

/**
 * The company page at `/companies/:symbol` and `/companies/:symbol/:tab`.
 *
 * The page parses `:symbol` into a `Ticker` and `:tab` into one of the seven
 * tabs of DESIGN.md §8. A symbol that is not a valid ticker shows the missing
 * state, the same state as a ticker that the gateway does not know. A tab
 * segment in another spelling, such as `Financials` or `overview`, redirects
 * to the tab's own URL. Any other unknown tab shows the no-such-tab state.
 * Otherwise the page loads the masthead through `useCompany` and shows the
 * loading, missing, failed or loaded state.
 *
 * The loaded state is a placeholder that names the company and the tab. The
 * masthead and the tab strip replace it in a later ticket.
 */
function CompanyPage() {
	const { symbol = "", tab: segment } = useParams();

	if (!Ticker.isValid(symbol)) {
		return <MissingCompanyState />;
	}
	const tab = findTab(segment);
	if (tab === null) {
		return <MissingTabState symbol={symbol} />;
	}
	if ((segment ?? null) !== tab.segment) {
		const tabPath = tab.segment === null ? "" : `/${tab.segment}`;
		return <Navigate to={`/companies/${symbol}${tabPath}`} replace />;
	}
	return <CompanyContent ticker={Ticker.parse(symbol)} tab={tab} />;
}

function CompanyContent({ ticker, tab }: { ticker: Ticker; tab: CompanyTab }) {
	const state = useCompany(ticker, "masthead");

	switch (state.status) {
		case "loading":
			return (
				<div className="flex-1 flex items-center justify-center px-4">
					<Spinner size="lg" label="Loading company" />
				</div>
			);
		case "missing":
			return <MissingCompanyState />;
		case "failed":
			return (
				<PageState title="The company data did not load.">
					Something went wrong on our side. Try again in a moment.
				</PageState>
			);
		case "loaded":
			return (
				<section className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-2">
					<Heading level={1} variant="page">
						{state.data.name}
					</Heading>
					<Text font="sans">{tab.label}</Text>
				</section>
			);
	}
}

function MissingCompanyState() {
	return (
		<PageState title="We found no company at this address.">
			Check the ticker in the address, or find the company in the screener.
		</PageState>
	);
}

function MissingTabState({ symbol }: { symbol: string }) {
	return (
		<PageState
			title="The company page has no such tab."
			action={{ to: `/companies/${symbol}`, label: "Open the overview" }}
		>
			The address names a tab that the company page does not have.
		</PageState>
	);
}

const SCREENER_ACTION = { to: "/screener", label: "Open the screener" };

/** A centered message for a state without company data, in the style of the not-found page. */
function PageState({
	title,
	action = SCREENER_ACTION,
	children,
}: {
	title: string;
	action?: { to: string; label: string };
	children: ReactNode;
}) {
	return (
		<div className="flex-1 flex items-center justify-center px-4 py-16">
			<section className="flex flex-col items-center text-center max-w-2xl mx-auto">
				<Heading level={1} variant="hero" className="mb-4">
					{title}
				</Heading>
				<Text font="sans" size="lg" className="mb-8">
					{children}
				</Text>
				<Button
					size="lg"
					variant="outline"
					className="px-8 tracking-wide"
					render={<Link to={action.to} />}
				>
					{action.label}
				</Button>
			</section>
		</div>
	);
}

export default CompanyPage;
