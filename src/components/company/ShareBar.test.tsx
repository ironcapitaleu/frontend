import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ownershipShares } from "@/lib/company/metrics";
import { meridianOverview } from "@/lib/company/sample/overview";
import type { Claim } from "@/lib/company/types";
import { ShareBar, type SharePart, shareSegments } from "./ShareBar";

const institutions = ownershipShares(meridianOverview).institutions as Claim;

/** Parts with the given shares, built from a real percent claim. */
function partsOf(...shares: (number | null)[]): SharePart[] {
	return shares.map((share, index) => ({
		label: `Part ${index + 1}`,
		share: share === null ? null : { ...institutions, value: share },
	}));
}

describe("shareSegments", () => {
	it("should take the chart tokens in order when there are five parts", () => {
		const expectedResult = [
			"bg-chart-1",
			"bg-chart-2",
			"bg-chart-3",
			"bg-chart-4",
			"bg-chart-5",
		];

		const result = shareSegments(partsOf(0.1, 0.1, 0.1, 0.1, 0.1)).map(
			(segment) => segment.fill,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should leave the rest of the bar empty when the shares sum below 100%", () => {
		const expectedResult = [40, 30];

		const result = shareSegments(partsOf(0.4, 0.3)).map(
			(segment) => segment.width,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should shrink the widths to fill the bar exactly when the shares sum above 100%", () => {
		const expectedResult = 100;

		const result = shareSegments(partsOf(0.9, 0.3, 0.3)).reduce(
			(sum, segment) => sum + (segment.width ?? 0),
			0,
		);

		expect(result).toBeCloseTo(expectedResult);
	});

	it("should draw no segment when a share is NaN", () => {
		const expectedResult = { share: null, width: null };

		const [segment] = shareSegments(partsOf(Number.NaN));
		const result = { share: segment?.share, width: segment?.width };

		expect(result).toEqual(expectedResult);
	});

	it("should draw no segment when a share is Infinity", () => {
		const expectedResult = { share: null, width: null };

		const [segment] = shareSegments(partsOf(Number.POSITIVE_INFINITY));
		const result = { share: segment?.share, width: segment?.width };

		expect(result).toEqual(expectedResult);
	});

	it("should fill the bar exactly when a negative share would pull the total below 100%", () => {
		const expectedResult = 100;

		const result = shareSegments(partsOf(0.7, 0.4, -0.2)).reduce(
			(sum, segment) => sum + (segment.width ?? 0),
			0,
		);

		expect(result).toBeCloseTo(expectedResult);
	});

	it("should treat the share as missing when its claim is not in the percent unit", () => {
		const expectedResult = { share: null, width: null };

		const [segment] = shareSegments([
			{
				label: "Revenue",
				share: { ...institutions, unit: "usd", value: 8.1e12 },
			},
		]);
		const result = { share: segment?.share, width: segment?.width };

		expect(result).toEqual(expectedResult);
	});

	it("should reuse chart-5 for every part past the fifth when there are more than five parts", () => {
		const expectedResult = ["bg-chart-5", "bg-chart-5"];

		const result = shareSegments(partsOf(0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1))
			.slice(5)
			.map((segment) => segment.fill);

		expect(result).toEqual(expectedResult);
	});
});

describe("ShareBar", () => {
	it("should print each label with its percentage and a dash for the missing share when one share is null", () => {
		render(<ShareBar aria-label="Ownership" parts={partsOf(0.625, null)} />);

		const expectedResult = ["Part 162.5%", "Part 2—"];

		const result = screen
			.getAllByRole("listitem")
			.map((item) => item.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should print the true share and draw no segment when a share is negative", () => {
		const { container } = render(
			<ShareBar aria-label="Revenue by segment" parts={partsOf(0.5, -0.03)} />,
		);

		const expectedResult = {
			labels: ["Part 150.0%", "Part 2−3.0%"],
			segments: 1,
		};

		// Deviation from TESTING.md §2.2: the bar is hidden from assistive
		// technology, so no accessible query reaches its segments.
		const result = {
			labels: screen.getAllByRole("listitem").map((item) => item.textContent),
			segments: container.querySelectorAll('[data-slot="share-bar-segment"]')
				.length,
		};

		expect(result).toEqual(expectedResult);
	});

	it("should print each part with its own share when two parts share a label and a part is added before them", () => {
		const others: SharePart[] = partsOf(0.1, 0.2).map((part) => ({
			...part,
			label: "Other",
		}));
		const { rerender } = render(
			<ShareBar aria-label="Revenue by segment" parts={others} />,
		);

		const expectedResult = ["Part 15.0%", "Other10.0%", "Other20.0%"];

		rerender(
			<ShareBar
				aria-label="Revenue by segment"
				parts={[...partsOf(0.05), ...others]}
			/>,
		);
		const result = screen
			.getAllByRole("listitem")
			.map((item) => item.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should make only the known share open its sources when one share is null", () => {
		render(<ShareBar aria-label="Ownership" parts={partsOf(0.625, null)} />);

		const expectedResult = ["62.5%"];

		const result = screen
			.getAllByRole("button")
			.map((button) => button.textContent);

		expect(result).toEqual(expectedResult);
	});

	it("should draw a segment only for the known share when one share is null", () => {
		const { container } = render(
			<ShareBar aria-label="Ownership" parts={partsOf(0.625, null)} />,
		);

		const expectedResult = 1;

		// Deviation from TESTING.md §2.2: the bar is hidden from assistive
		// technology, so no accessible query reaches its segments.
		const result = container.querySelectorAll(
			'[data-slot="share-bar-segment"]',
		).length;

		expect(result).toBe(expectedResult);
	});
});
