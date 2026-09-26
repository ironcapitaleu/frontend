import { describe, expect, it } from "vitest";

import { Ticker } from "../../../lib/domain/ticker";
import { alwaysFoundCompanyGateway } from "./always-found";

describe("alwaysFoundCompanyGateway", () => {
	it("should resolve a masthead with the requested ticker when asked for any ticker", async () => {
		const gateway = alwaysFoundCompanyGateway();

		const expectedResult = { ticker: "MRDN", symbol: "MRDN" };

		const masthead = await gateway.getMasthead(Ticker.parse("MRDN"));
		const result = {
			ticker: masthead.ticker.value,
			symbol: masthead.listings[0].symbol,
		};

		expect(result).toEqual(expectedResult);
	});
});
