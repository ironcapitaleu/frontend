import { describe, expect, it } from "vitest";

import { MissingCompany } from "../../../lib/company/errors";
import { Ticker } from "../../../lib/domain/ticker";
import { alwaysMissingCompanyGateway } from "./always-missing";

describe("alwaysMissingCompanyGateway", () => {
	it("should reject with a MissingCompany for the input ticker when asked for the overview", async () => {
		const gateway = alwaysMissingCompanyGateway();
		const ticker = Ticker.parse("MRDN");

		const expectedResult = new MissingCompany(ticker);

		const result = gateway.getOverview(ticker);

		await expect(result).rejects.toEqual(expectedResult);
	});
});
