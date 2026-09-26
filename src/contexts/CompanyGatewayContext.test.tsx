import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { Ticker } from "../lib/domain/ticker";
import { alwaysFoundCompanyGateway } from "../test/fixtures/companies/always-found";
import {
	CompanyGatewayProvider,
	useCompanyGateway,
} from "./CompanyGatewayContext";

describe("useCompanyGateway", () => {
	it("should throw a guidance error when used outside a CompanyGatewayProvider", () => {
		const expectedResult =
			"useCompanyGateway must be used within a CompanyGatewayProvider";

		const result = () => renderHook(() => useCompanyGateway());

		expect(result).toThrow(expectedResult);
	});

	it("should give a consumer the same default gateway on every render when the provider has no gateway prop", () => {
		const wrapper = ({ children }: { children: ReactNode }) => (
			<CompanyGatewayProvider>{children}</CompanyGatewayProvider>
		);
		const { result: probe, rerender } = renderHook(() => useCompanyGateway(), {
			wrapper,
		});
		const first = probe.current;

		const expectedResult = first;

		rerender();
		const result = probe.current;

		expect(result).toBe(expectedResult);
	});

	it("should find MRDN through the default gateway when the provider has no gateway prop", async () => {
		const wrapper = ({ children }: { children: ReactNode }) => (
			<CompanyGatewayProvider>{children}</CompanyGatewayProvider>
		);
		const { result: probe } = renderHook(() => useCompanyGateway(), {
			wrapper,
		});

		const expectedResult = "MRDN";

		const masthead = await probe.current.getMasthead(Ticker.parse("MRDN"));
		const result = masthead.ticker.value;

		expect(result).toBe(expectedResult);
	});

	it("should give a consumer the injected gateway when the consumer is inside the provider", () => {
		const gateway = alwaysFoundCompanyGateway();
		const wrapper = ({ children }: { children: ReactNode }) => (
			<CompanyGatewayProvider gateway={gateway}>
				{children}
			</CompanyGatewayProvider>
		);

		const expectedResult = gateway;

		const { result: probe } = renderHook(() => useCompanyGateway(), {
			wrapper,
		});
		const result = probe.current;

		expect(result).toBe(expectedResult);
	});
});
