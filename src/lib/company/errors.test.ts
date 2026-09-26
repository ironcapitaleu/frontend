import { describe, expect, it } from "vitest";

import { Ticker } from "../domain/ticker";
import {
	FailedCompanyRequest,
	MissingCompany,
	MissingGuardInput,
} from "./errors";

describe("MissingCompany", () => {
	it("should name the ticker in an input tail when constructed with a ticker", () => {
		const failure = new MissingCompany(Ticker.parse("xyz"));

		const expectedResult =
			"[MissingCompany] No company has this ticker, Input: 'XYZ'";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should keep the ticker when constructed with a ticker", () => {
		const ticker = Ticker.parse("XYZ");
		const failure = new MissingCompany(ticker);

		const expectedResult = true;

		const result = failure.ticker.equals(ticker);

		expect(result).toBe(expectedResult);
	});

	it("should take its own class name as the error name when constructed with a ticker", () => {
		const failure = new MissingCompany(Ticker.parse("XYZ"));

		const expectedResult = "MissingCompany";

		const result = failure.name;

		expect(result).toBe(expectedResult);
	});
});

describe("FailedCompanyRequest", () => {
	it("should format its bracketed message when constructed without a reason", () => {
		const failure = new FailedCompanyRequest();

		const expectedResult =
			"[FailedCompanyRequest] The company request did not complete";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should append the reason tail when constructed with a reason", () => {
		const failure = new FailedCompanyRequest("Network timeout");

		const expectedResult =
			"[FailedCompanyRequest] The company request did not complete, Reason: 'Network timeout'";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});

	it("should hold a null reason when constructed without a reason", () => {
		const failure = new FailedCompanyRequest();

		const expectedResult = null;

		const result = failure.reason;

		expect(result).toBe(expectedResult);
	});

	it("should take its own class name as the error name when constructed without a reason", () => {
		const failure = new FailedCompanyRequest();

		const expectedResult = "FailedCompanyRequest";

		const result = failure.name;

		expect(result).toBe(expectedResult);
	});
});

describe("MissingGuardInput", () => {
	it("should name the metric and the guarded figure in a reason tail when constructed with a reference", () => {
		const failure = new MissingGuardInput("currentRatio", {
			from: "line",
			key: "totalCurrentLiabilities",
			at: { kind: "fiscalYear", yearsBack: 0 },
		});

		const expectedResult =
			"[MissingGuardInput] A guard names a figure that is not an input of its metric, Reason: 'currentRatio guards line totalCurrentLiabilities @ fiscalYear(0)'";

		const result = failure.message;

		expect(result).toBe(expectedResult);
	});
});
