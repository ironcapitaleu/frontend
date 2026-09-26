import { describe, expect, it } from "vitest";

import { FailedCompanyRequest } from "../../../lib/company/errors";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFailingCompanyGateway } from "./always-failing";

describe("alwaysFailingCompanyGateway", () => {
	it("should reject with a FailedCompanyRequest when asked for the financials", async () => {
		const gateway = alwaysFailingCompanyGateway();

		const expectedResult = new FailedCompanyRequest();

		const result = gateway.getFinancials(Ticker.parse("MRDN"));

		await expect(result).rejects.toEqual(expectedResult);
	});
});
