import { describe, expect, it } from "vitest";

import { MISSING } from "@/components/screener/format";
import { type CheckId, checks, evaluateCheck } from "@/lib/company/checks";
import { completeSections } from "@/lib/company/metrics";
import type { Claim, CompletedSections } from "@/lib/company/types";
import { fakeCompanyReport } from "../../../test/fixtures/companies/fake-company-report";
import {
	type SentencePart,
	sentenceClaims,
	sentenceOf,
	sourceLine,
} from "./ChecksByArea.logic";

const sections = completeSections(fakeCompanyReport);

/** Returns the check `id`, and fails the test when the set lacks it. */
function checkOf(id: CheckId) {
	const found = checks.find((check) => check.id === id);
	if (!found) throw new Error(`The check set has no ${id}.`);
	return found;
}

/** Writes a sentence as the page reads it, with the dash for a missing figure. */
function textOf(parts: readonly SentencePart[]): string {
	return parts
		.map((part) => {
			if (typeof part === "string") return part;
			const { figure, format } = part;
			return figure === null || typeof figure.value !== "number"
				? MISSING
				: format(figure.value);
		})
		.join("");
}

/** Returns the sentence of check `id` over `from`. */
function sentence(id: CheckId, from: CompletedSections = sections): string {
	return textOf(sentenceOf(evaluateCheck(checkOf(id), from), from));
}

describe("sentenceOf", () => {
	it("should write the figure and the threshold into the sentence when B2 is read", () => {
		const expectedResult =
			"The current ratio (2.0) is at least the threshold of 1.5.";

		const result = sentence("B2");

		expect(result).toBe(expectedResult);
	});

	it("should say the cash is not above the debt when B1 is not met", () => {
		const expectedResult =
			"Cash and short-term investments ($540.0M) are not above total debt ($652.5M).";

		const result = sentence("B1");

		expect(result).toBe(expectedResult);
	});

	it("should name the missing section when V2 is read before Valuation loads", () => {
		const expectedResult =
			"The free cash flow yield (2.7%) needs to be above the 10-year Treasury yield (—), but a section of the page has no data.";

		const result = sentence("V2", { ...sections, valuation: null });

		expect(result).toBe(expectedResult);
	});

	it("should give the plural verb and name the compared shares when S1 is read", () => {
		const expectedResult =
			"Diluted shares in the latest fiscal year (151.1M) are below diluted shares five fiscal years earlier (158.4M).";

		const result = sentence("S1");

		expect(result).toBe(expectedResult);
	});

	it("should name the missing section when C1 is read before Financials loads", () => {
		const expectedResult =
			"Free cash flow was above 0 in —. The rule asks for at least 8, but a section of the page has no data.";

		const result = sentence("C1", { ...sections, financials: null });

		expect(result).toBe(expectedResult);
	});

	it("should name the compared figure in every sentence when each check is read", () => {
		const expectedResult: CheckId[] = [];

		const result = checks
			.filter(({ id }) => sentence(id).includes("undefined"))
			.map(({ id }) => id);

		expect(result).toEqual(expectedResult);
	});

	it("should test a metric in every check with a fixed threshold when the check set is read", () => {
		const expectedResult: CheckId[] = [];

		const result = checks
			.filter(
				({ threshold, subject }) =>
					threshold.kind === "value" && subject.from !== "metric",
			)
			.map(({ id }) => id);

		expect(result).toEqual(expectedResult);
	});

	it("should count the years in the sentence when C2 reads a window", () => {
		const expectedResult =
			"Net income was above 0 in 10 of 10 years. The rule asks for at least 8.";

		const result = sentence("C2");

		expect(result).toBe(expectedResult);
	});

	it("should name the input of the failed guard when the P/E has no reading", () => {
		const eps: Claim = {
			id: "line.dilutedEps.FY2025",
			label: "Diluted EPS",
			value: -1.2,
			unit: "usdPerShare",
			period: null,
			source: { kind: "derived", formula: "made up", inputs: [] as never },
		};
		const failed = {
			check: checkOf("V1"),
			state: "notEnoughData" as const,
			reason: "failedGuard" as const,
			claims: [eps],
		};

		const expectedResult =
			"Diluted EPS is −$1.20, not above 0, so the check has no reading.";

		const result = textOf(sentenceOf(failed, sections));

		expect(result).toBe(expectedResult);
	});
});

describe("sentenceClaims", () => {
	it("should list the two claims that B1 compares when its sentence is read", () => {
		const checked = evaluateCheck(checkOf("B1"), sections);

		const expectedResult = checked.claims.map(({ id }) => id);

		const result = sentenceClaims(sentenceOf(checked, sections)).map(
			({ id }) => id,
		);

		expect(result).toEqual(expectedResult);
	});
});

describe("sourceLine", () => {
	it("should name the one document in the singular when a check reads one", () => {
		const expectedResult = "Source: 10-K for FY2025";

		const result = sourceLine(["10-K for FY2025"]);

		expect(result).toBe(expectedResult);
	});

	it("should name both documents when a check reads two", () => {
		const expectedResult = "Sources: 10-Q for Q2 FY2026 · 10-K for FY2025";

		const result = sourceLine(["10-Q for Q2 FY2026", "10-K for FY2025"]);

		expect(result).toBe(expectedResult);
	});

	it("should name the first two documents and count the rest when a check reads ten years", () => {
		const labels = Array.from(
			{ length: 10 },
			(_, back) => `10-K for FY${2025 - back}`,
		);

		const expectedResult =
			"Sources: 10-K for FY2025 · 10-K for FY2024 and 8 more";

		const result = sourceLine(labels);

		expect(result).toBe(expectedResult);
	});
});
