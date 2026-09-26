import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { priceChangeOneMonth } from "@/lib/company/metrics";
import type { Claim, ReportedSource } from "@/lib/company/types";
import { fakeCompanyReport } from "@/test/fixtures/companies/fake-company-report";
import { SourceCard, SourceTrigger } from "./SourceCard";

const { masthead, overview, financials } = fakeCompanyReport;
const price = masthead.price as Claim;
const revenue = financials.income.annual.lines[0].points.at(-1) as Claim;
const institutionShares = overview.ownership.institutionShares as Claim;
const low52Weeks = masthead.low52Weeks as Claim;

/** The 13F-HR holding, linked to its information table rather than the primary document. */
const informationTableUrl =
	"https://www.sec.gov/Archives/edgar/data/1999999/000199999925000009/infotable.xml";
const heldInInformationTable: Claim = {
	...institutionShares,
	source: {
		...(institutionShares.source as ReportedSource),
		url: informationTableUrl,
	},
};

/** A derived claim with `count` reported inputs, as a sector median reads one claim for each peer. */
function withInputs(count: number): Claim {
	const [first, ...rest] = Array.from({ length: count }, (_, index) => ({
		...revenue,
		id: `test.peer${index + 1}`,
		label: `Revenue of peer ${index + 1}`,
	}));
	return {
		id: "test.median",
		label: "Sector median revenue",
		value: 0,
		unit: "usd",
		period: null,
		source: {
			kind: "derived",
			formula: "Median of the peers' revenue",
			inputs: [first, ...rest],
		},
	};
}

/** The number of inputs the card lists, and the line that counts the rest, if any. */
function listedInputs() {
	return {
		listed: screen.getAllByRole("listitem").length,
		unlisted: screen.queryByText(/^and \d+ more$/)?.textContent ?? null,
	};
}

/** A derived claim whose first input is itself derived, so the card walks two levels. */
const nested: Claim = {
	id: "test.nested",
	label: "Price change against revenue",
	value: 0,
	unit: "ratio",
	period: null,
	source: {
		kind: "derived",
		formula: "Price change over one month ÷ Revenue",
		inputs: [priceChangeOneMonth(masthead) as Claim, revenue],
	},
};

/**
 * A derived claim that reaches itself: its input's own input is the claim
 * again, as a bad metric definition on a server can produce.
 */
function cyclic(): Claim {
	const loop: { -readonly [K in keyof Claim]: Claim[K] } = {
		id: "test.loop",
		label: "Looping ratio",
		value: 0,
		unit: "ratio",
		period: null,
		source: {
			kind: "derived",
			formula: "Looping ratio ÷ Revenue",
			inputs: [revenue],
		},
	};
	const inner: Claim = {
		...loop,
		id: "test.inner",
		label: "Inner ratio",
		source: { kind: "derived", formula: "Looping ratio × 2", inputs: [loop] },
	};
	loop.source = {
		kind: "derived",
		formula: "Inner ratio ÷ Revenue",
		inputs: [inner, revenue],
	};
	return loop;
}

/**
 * Makes the window `width` px wide for `matchMedia`, which jsdom lacks. It
 * answers `max-width` queries against the width and returns a function that
 * resizes the window and tells the listeners.
 */
function stubWidth(width: number): (next: number) => void {
	let current = width;
	const listeners: Array<() => void> = [];
	const maxWidth = (query: string) =>
		Number(
			/max-width:\s*([\d.]+)px/.exec(query)?.[1] ?? Number.POSITIVE_INFINITY,
		);
	vi.spyOn(window, "matchMedia").mockImplementation(
		(query: string) =>
			({
				get matches() {
					return current <= maxWidth(query);
				},
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: (_type: string, listener: () => void) => {
					listeners.push(listener);
				},
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}) as unknown as MediaQueryList,
	);
	return (next) => {
		current = next;
		act(() => {
			for (const notify of listeners) notify();
		});
	};
}

/** The text of each `dd` of the card, in order. */
function definitions(): (string | null)[] {
	return screen.getAllByRole("definition").map((item) => item.textContent);
}

/** Renders the figure `$84.20` wrapped in a trigger, with a button after it to move focus to. */
function renderTrigger() {
	render(
		<>
			<SourceTrigger claim={price}>$84.20</SourceTrigger>
			<button type="button">Next</button>
		</>,
	);
}

/** Whether the source card of the price is open. */
function cardOpen(): boolean {
	return screen.queryByRole("dialog", { name: "Sources of Price" }) !== null;
}

describe("SourceCard", () => {
	it("should name the filing, the filing date, the line and the XBRL tag when the claim is reported in a 10-K", () => {
		render(<SourceCard claim={revenue} />);

		const expectedResult = [
			"10-K for FY2025, Quillvane Instruments, Inc.",
			"19 Feb 2026",
			"Consolidated statements of income › Revenue",
			"us-gaap:Revenues",
		];

		const result = definitions();

		expect(result).toEqual(expectedResult);
	});

	it("should link to the exact document on SEC EDGAR when the claim is reported in a filing", () => {
		render(<SourceCard claim={revenue} />);

		const expectedResult =
			"https://www.sec.gov/Archives/edgar/data/1999999/000199999926000003/qvan.htm";

		const result = screen.getByRole("link", {
			name: "Open the filing on SEC EDGAR",
		});

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should link to the information table when the claim is reported in a 13F-HR information table", () => {
		render(<SourceCard claim={heldInInformationTable} />);

		const expectedResult = informationTableUrl;

		const result = screen.getByRole("link", {
			name: "Open the filing on SEC EDGAR",
		});

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should name the line alone when the document reports no XBRL fact", () => {
		render(<SourceCard claim={institutionShares} />);

		const expectedResult = [
			"13F-HR for Q3 2025, Quillvane Instruments, Inc.",
			"14 Nov 2025",
			"Information table › Shares (sshPrnamt)",
		];

		const result = definitions();

		expect(result).toEqual(expectedResult);
	});

	it("should name the dataset and link to it when the claim is market data", () => {
		render(<SourceCard claim={price} />);

		const expectedResult = {
			definitions: [
				"End-of-day prices, NASDAQ",
				"20 Mar 2026",
				"Closing price, NASDAQ",
			],
			link: "https://prices.example/QVAN",
		};

		const result = {
			definitions: definitions(),
			link: screen
				.getByRole("link", { name: "Open the data source" })
				.getAttribute("href"),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should date market data by the claim's own date when the claim's date differs from the dataset's", () => {
		render(<SourceCard claim={low52Weeks} />);

		const expectedResult = [
			"End-of-day prices, NASDAQ",
			"8 Apr 2025",
			"Closing price, NASDAQ",
		];

		const result = definitions();

		expect(result).toEqual(expectedResult);
	});

	it("should list every input and count none when a derived claim has exactly ten inputs", () => {
		render(<SourceCard claim={withInputs(10)} />);

		const expectedResult = { listed: 10, unlisted: null };

		const result = listedInputs();

		expect(result).toEqual(expectedResult);
	});

	it.each([
		[11, "and 1 more"],
		[61, "and 51 more"],
	])(
		"should list the first ten inputs and count the rest when a derived claim has %i inputs",
		(count, unlisted) => {
			render(<SourceCard claim={withInputs(count)} />);

			const expectedResult = { listed: 10, unlisted };

			const result = listedInputs();

			expect(result).toEqual(expectedResult);
		},
	);

	it("should show each formula and walk every input down to its reported line when a derived claim has a derived input", () => {
		render(<SourceCard claim={nested} />);

		const expectedResult = {
			formulas: [
				"Price change over one month ÷ Revenue",
				"(Price − Price a month earlier) ÷ Price a month earlier",
			],
			lines: [
				"Closing price, NASDAQ",
				"Closing price, NASDAQ",
				"Consolidated statements of income › Revenue",
			],
		};

		const result = {
			formulas: screen
				.getAllByText("Formula", { selector: "dt" })
				.map((term) => term.nextElementSibling?.textContent),
			lines: screen
				.getAllByText("Line", { selector: "dt" })
				.map((term) => term.nextElementSibling?.textContent),
		};

		expect(result).toEqual(expectedResult);
	});

	it("should stop the walk with a note when a derived claim reaches itself through its inputs", () => {
		render(<SourceCard claim={cyclic()} />);

		const expectedResult = "(repeats above)";

		const result = screen.getByText(expectedResult);

		expect(result).toHaveTextContent(expectedResult);
	});
});

describe("SourceTrigger", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should preview the card when the pointer rests on the figure", async () => {
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = "Sources of Price";

		await user.hover(screen.getByRole("button", { name: "$84.20" }));
		const result = await screen.findByRole("dialog");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should keep the preview open when the pointer leaves the figure while the figure holds focus", async () => {
		const user = userEvent.setup();
		renderTrigger();
		const figure = screen.getByRole("button", { name: "$84.20" });

		const expectedResult = true;

		await user.tab();
		await user.hover(figure);
		await user.unhover(figure);
		await new Promise((resolve) => setTimeout(resolve, 300));
		const result = cardOpen();

		expect(result).toBe(expectedResult);
	});

	it("should name the sheet after the figure when the window is a phone", async () => {
		stubWidth(375);
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = "Sources of Price";

		await user.click(screen.getByRole("button", { name: "$84.20" }));
		const result = await screen.findByRole("dialog");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should open the card as a sheet when the window is 767.5 px wide", async () => {
		stubWidth(767.5);
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = "Close";

		await user.click(screen.getByRole("button", { name: "$84.20" }));
		const result = await screen.findByRole("button", { name: expectedResult });

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should keep a pinned card closed when the window narrows to a phone and widens again", async () => {
		const resize = stubWidth(1280);
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = false;

		await user.click(screen.getByRole("button", { name: "$84.20" }));
		resize(375);
		resize(1280);
		const result = cardOpen();

		expect(result).toBe(expectedResult);
	});

	it("should preview the card when the figure takes focus", async () => {
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = true;

		await user.tab();
		const result = cardOpen();

		expect(result).toBe(expectedResult);
	});

	it("should close the preview when focus leaves the figure", async () => {
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = false;

		await user.tab();
		act(() => screen.getByRole("button", { name: "Next" }).focus());
		const result = cardOpen();

		expect(result).toBe(expectedResult);
	});

	it.each(["{Enter}", "[Space]"])(
		"should keep the card open after focus leaves when %s pins it",
		async (key) => {
			const user = userEvent.setup();
			renderTrigger();

			const expectedResult = true;

			await user.tab();
			await user.keyboard(key);
			act(() => screen.getByRole("button", { name: "Next" }).focus());
			const result = cardOpen();

			expect(result).toBe(expectedResult);
		},
	);

	it("should close the card and keep it closed as focus returns to the figure when Escape is pressed inside the pinned card", async () => {
		const user = userEvent.setup();
		renderTrigger();

		const expectedResult = false;

		await user.tab();
		await user.keyboard("{Enter}");
		await user.tab();
		await user.keyboard("{Escape}");
		const result = cardOpen();

		expect(result).toBe(expectedResult);
	});
});
