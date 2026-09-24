import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { CompanyGatewayProvider } from "../contexts/CompanyGatewayContext";
import { FailedCompanyRequest, MissingCompany } from "../lib/company/errors";
import type { CompanyGateway } from "../lib/company/gateway";
import type { MastheadSection } from "../lib/company/types";
import { Ticker } from "../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "../test/fixtures/companies/always-failing";
import { alwaysFoundCompanyGateway } from "../test/fixtures/companies/always-found";
import { alwaysMissingCompanyGateway } from "../test/fixtures/companies/always-missing";
import { type CompanySectionKey, useCompany } from "./useCompany";

interface Props<K extends CompanySectionKey> {
	ticker: Ticker;
	section: K;
}

/** Renders `useCompany` inside a `CompanyGatewayProvider` that holds `gateway`. */
function renderCompany<K extends CompanySectionKey>(
	gateway: CompanyGateway,
	initialProps: Props<K>,
) {
	const wrapper = ({ children }: { children: ReactNode }) =>
		createElement(CompanyGatewayProvider, { gateway, children });
	return renderHook(
		({ ticker, section }: Props<K>) => useCompany(ticker, section),
		{ wrapper, initialProps },
	);
}

async function settled(hook: { current: { status: string } }) {
	await waitFor(() => {
		if (hook.current.status === "loading") throw new Error("still loading");
	});
}

describe("useCompany", () => {
	it("should return the loading state when the gateway has not answered yet", () => {
		const gateway: CompanyGateway = {
			...alwaysFoundCompanyGateway(),
			getMasthead: () => new Promise<never>(() => {}),
		};
		const { result: hook } = renderCompany(gateway, {
			ticker: Ticker.parse("MRDN"),
			section: "masthead",
		});

		const expectedResult = { status: "loading" };

		const result = hook.current;

		expect(result).toEqual(expectedResult);
	});

	it("should return the masthead of the requested ticker when the gateway finds the company", async () => {
		const { result: hook } = renderCompany(alwaysFoundCompanyGateway(), {
			ticker: Ticker.parse("MRDN"),
			section: "masthead",
		});

		const expectedResult = { status: "loaded", ticker: "MRDN" };

		await settled(hook);
		const state = hook.current;
		const result = {
			status: state.status,
			ticker: state.status === "loaded" ? state.data.ticker.value : null,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should return the missing state when getMasthead rejects with MissingCompany", async () => {
		const ticker = Ticker.parse("MRDN");
		const { result: hook } = renderCompany(alwaysMissingCompanyGateway(), {
			ticker,
			section: "masthead",
		});

		const expectedResult = {
			status: "missing",
			error: new MissingCompany(ticker),
		};

		await settled(hook);
		const result = hook.current;

		expect(result).toEqual(expectedResult);
	});

	it("should return the failed state when a tab section rejects with MissingCompany", async () => {
		const ticker = Ticker.parse("MRDN");
		const { result: hook } = renderCompany(alwaysMissingCompanyGateway(), {
			ticker,
			section: "overview",
		});

		const expectedResult = {
			status: "failed",
			error: new MissingCompany(ticker),
		};

		await settled(hook);
		const result = hook.current;

		expect(result).toEqual(expectedResult);
	});

	it("should return the failed state when the gateway rejects with FailedCompanyRequest", async () => {
		const { result: hook } = renderCompany(alwaysFailingCompanyGateway(), {
			ticker: Ticker.parse("MRDN"),
			section: "financials",
		});

		const expectedResult = {
			status: "failed",
			error: new FailedCompanyRequest(),
		};

		await settled(hook);
		const result = hook.current;

		expect(result).toEqual(expectedResult);
	});

	it("should return the failed state when the gateway rejects with an unexpected error", async () => {
		const error = new TypeError("Cannot read the response");
		const gateway: CompanyGateway = {
			...alwaysFoundCompanyGateway(),
			getOverview: () => Promise.reject(error),
		};
		const { result: hook } = renderCompany(gateway, {
			ticker: Ticker.parse("MRDN"),
			section: "overview",
		});

		const expectedResult = { status: "failed", error };

		await settled(hook);
		const result = hook.current;

		expect(result).toEqual(expectedResult);
	});

	it("should return the failed state when a gateway method throws instead of rejecting", async () => {
		const error = new FailedCompanyRequest();
		const gateway: CompanyGateway = {
			...alwaysFoundCompanyGateway(),
			getOverview: () => {
				throw error;
			},
		};
		const { result: hook } = renderCompany(gateway, {
			ticker: Ticker.parse("MRDN"),
			section: "overview",
		});

		const expectedResult = { status: "failed", error };

		await settled(hook);
		const result = hook.current;

		expect(result).toEqual(expectedResult);
	});

	it("should ignore the result of the old symbol when the symbol changes before the first result", async () => {
		const found = alwaysFoundCompanyGateway();
		const answers = new Map<string, (masthead: MastheadSection) => void>();
		const gateway: CompanyGateway = {
			...found,
			getMasthead: (ticker) =>
				new Promise((resolve) => {
					answers.set(ticker.value, resolve);
				}),
		};
		const { result: hook, rerender } = renderCompany(gateway, {
			ticker: Ticker.parse("MRDN"),
			section: "masthead",
		});

		const expectedResult = { status: "loaded", ticker: "QVAN" };

		rerender({ ticker: Ticker.parse("QVAN"), section: "masthead" });
		const answer = async (symbol: string) => {
			const masthead = await found.getMasthead(Ticker.parse(symbol));
			await act(async () => answers.get(symbol)?.(masthead));
		};
		await answer("QVAN");
		await answer("MRDN");
		const state = hook.current;
		const result = {
			status: state.status,
			ticker: state.status === "loaded" ? state.data.ticker.value : null,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should call the gateway once when a new Ticker instance has the same symbol", async () => {
		const found = alwaysFoundCompanyGateway();
		let calls = 0;
		const gateway: CompanyGateway = {
			...found,
			getMasthead: (ticker) => {
				calls += 1;
				return found.getMasthead(ticker);
			},
		};
		const { result: hook, rerender } = renderCompany(gateway, {
			ticker: Ticker.parse("MRDN"),
			section: "masthead",
		});

		const expectedResult = 1;

		await settled(hook);
		rerender({ ticker: Ticker.parse("mrdn"), section: "masthead" });
		await settled(hook);
		const result = calls;

		expect(result).toBe(expectedResult);
	});

	it("should load the new section when the section changes for the same ticker", async () => {
		const ticker = Ticker.parse("MRDN");
		const { result: hook, rerender } = renderCompany<CompanySectionKey>(
			alwaysFoundCompanyGateway(),
			{ ticker, section: "masthead" },
		);

		const expectedResult = { status: "loaded", overviewLoaded: true };

		await settled(hook);
		rerender({ ticker, section: "overview" });
		await settled(hook);
		const state = hook.current;
		const result = {
			status: state.status,
			overviewLoaded:
				state.status === "loaded" && state.sections.overview !== null,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should call the gateway once when the parent re-renders with the same gateway", async () => {
		const found = alwaysFoundCompanyGateway();
		let calls = 0;
		const gateway: CompanyGateway = {
			...found,
			getMasthead: (ticker) => {
				calls += 1;
				return found.getMasthead(ticker);
			},
		};
		const ticker = Ticker.parse("MRDN");
		const { result: hook, rerender } = renderCompany(gateway, {
			ticker,
			section: "masthead",
		});

		const expectedResult = 1;

		await settled(hook);
		rerender({ ticker, section: "masthead" });
		rerender({ ticker, section: "masthead" });
		await settled(hook);
		const result = calls;

		expect(result).toBe(expectedResult);
	});

	it("should call the gateway again when the provider receives a new gateway instance", async () => {
		const found = alwaysFoundCompanyGateway();
		let calls = 0;
		const countingGateway = (): CompanyGateway => ({
			...found,
			getMasthead: (ticker) => {
				calls += 1;
				return found.getMasthead(ticker);
			},
		});
		let gateway = countingGateway();
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(CompanyGatewayProvider, { gateway, children });
		const ticker = Ticker.parse("MRDN");
		const { result: hook, rerender } = renderHook(
			() => useCompany(ticker, "masthead"),
			{ wrapper },
		);

		const expectedResult = 2;

		await settled(hook);
		gateway = countingGateway();
		rerender();
		await settled(hook);
		const result = calls;

		expect(result).toBe(expectedResult);
	});

	it("should throw an Error that names CompanyGatewayProvider when used outside a provider", () => {
		const expectedResult =
			"useCompanyGateway must be used within a CompanyGatewayProvider";

		const result = () =>
			renderHook(() => useCompany(Ticker.parse("MRDN"), "masthead"));

		expect(result).toThrow(expectedResult);
	});
});
