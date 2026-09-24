import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

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
