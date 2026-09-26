import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import {
	emulatePrintMedia,
	PAPER_VIEWPORTS,
} from "../../../.storybook/utils/printMedia";
import Layout from "../../components/Layout";
import { CompanyGatewayProvider } from "../../contexts/CompanyGatewayContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { sampleCompanyGateway } from "../../lib/company/sampleCompanyGateway";
import CompanyPage from "./CompanyPage";

const gateway = sampleCompanyGateway();

/** The names of the headings of the printed regions, in the order of the page. */
const REGIONS = [
	"Meridian Semiconductor Corp.",
	"Key figures",
	"The business",
	"Checks by area",
	"Ten years of results",
	"Balance sheet",
	"Shareholder returns",
	"Ownership",
];

/** Both pages of the summary fit the paper (DESIGN.md §8 "Print Summary"). */
const TWO_PAGES = {
	regions: REGIONS,
	fitsWidth: true,
	secondPageBreak: "page",
	pagesThatFit: [true, true],
};

/**
 * The Overview of MRDN as the browser prints it (DESIGN.md §8 "Print
 * Summary"). Each story renders the page in the site layout at print media,
 * with the printable area of A4 or Letter paper as its viewport. The printed
 * summary shows the six regions on two pages and hides the controls of the
 * screen.
 */
const meta: Meta<typeof CompanyPage> = {
	title: "Pages/CompanyPage/PrintSummary",
	component: CompanyPage,
	parameters: { layout: "fullscreen", viewport: { options: PAPER_VIEWPORTS } },
	beforeEach: emulatePrintMedia,
	decorators: [
		(Story) => (
			<ThemeProvider>
				<CompanyGatewayProvider gateway={gateway}>
					<MemoryRouter initialEntries={["/companies/MRDN"]}>
						<Routes>
							<Route element={<Layout />}>
								<Route path="/companies/:symbol" element={<Story />} />
							</Route>
						</Routes>
					</MemoryRouter>
				</CompanyGatewayProvider>
			</ThemeProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof CompanyPage>;

/**
 * The elements of `role` that the printed page shows. The summary is
 * `hidden` on the screen, and a role query skips a `hidden` element whatever
 * its style, so the query takes every element and keeps the visible ones.
 */
function printed(canvasElement: HTMLElement, role: string, level?: number) {
	return within(canvasElement)
		.queryAllByRole(role, { level, hidden: true })
		.filter((element) => element.checkVisibility());
}

/**
 * Reads the printed region headings, whether the summary fits the paper's
 * width, the break before its second page, and whether each page fits the
 * paper's height. It measures the article of the summary, not the document:
 * the first page runs from the top of the article to the second page, and
 * the second page from there to the end of the article.
 */
async function readPrintedPage(canvasElement: HTMLElement) {
	await waitFor(() =>
		within(canvasElement).getByRole("region", {
			name: "Sources",
			hidden: true,
		}),
	);
	const article = canvasElement.querySelector<HTMLElement>(
		'[data-slot="print-summary"]',
	);
	if (article === null) throw new Error("The printed summary is missing");
	const second = article.querySelector<HTMLElement>(
		'[data-slot="print-second-page"]',
	);
	const top = article.getBoundingClientRect().top;
	const firstHeight = (second?.getBoundingClientRect().top ?? top) - top;
	const heights = [firstHeight, article.scrollHeight - firstHeight];
	return {
		regions: [
			...printed(canvasElement, "heading", 1),
			...printed(canvasElement, "heading", 2),
		].map(({ textContent }) => textContent),
		fitsWidth:
			article.scrollWidth <= article.clientWidth &&
			document.documentElement.scrollWidth <=
				document.documentElement.clientWidth,
		secondPageBreak: second && getComputedStyle(second).breakBefore,
		pagesThatFit: heights.map((height) => height <= window.innerHeight),
	};
}

/**
 * The size in points of the smallest printed text, and of the smallest
 * printed paragraph, to one decimal and rounded down.
 */
function smallestType(canvasElement: HTMLElement) {
	const texts = [
		...canvasElement.querySelectorAll<HTMLElement>(
			'[data-slot="print-summary"] *',
		),
	].filter(
		(element) =>
			element.checkVisibility() &&
			[...element.childNodes].some(
				(node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
			),
	);
	const points = (elements: HTMLElement[]) =>
		Math.floor(
			Math.min(
				...elements.map(
					(element) =>
						(parseFloat(getComputedStyle(element).fontSize) * 72) / 96,
				),
			) * 10,
		) / 10;
	return {
		text: points(texts),
		prose: points(texts.filter((element) => element.tagName === "P")),
	};
}

/** The six regions on the printable area of A4 paper, on two pages. */
export const PrintedOnA4: Story = {
	globals: { viewport: { value: "a4", isRotated: false } },
	play: async ({ canvasElement }) => {
		const expectedResult = TWO_PAGES;

		const result = await readPrintedPage(canvasElement);

		await expect(result).toEqual(expectedResult);
	},
};

/** The six regions on the printable area of Letter paper, on two pages. */
export const PrintedOnLetter: Story = {
	globals: { viewport: { value: "letter", isRotated: false } },
	play: async ({ canvasElement }) => {
		const expectedResult = TWO_PAGES;

		const result = await readPrintedPage(canvasElement);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * No printed text is smaller than 7pt, the floor for tables and labels, and
 * no printed paragraph is smaller than 8pt, the floor for prose (DESIGN.md
 * §8 "Print Summary").
 */
export const PrintsAtTheTypeFloor: Story = {
	globals: { viewport: { value: "a4", isRotated: false } },
	play: async ({ canvasElement }) => {
		await readPrintedPage(canvasElement);

		const expectedResult = { text: 7, prose: 8 };

		const result = smallestType(canvasElement);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * The printed page hides the site navigation and footer, the tab strip, the
 * Export button, the "Data" buttons, the "Sources" chips, the sources index,
 * and a source card that a figure opened, with the backdrop behind it.
 */
export const HidesScreenControls: Story = {
	globals: { viewport: { value: "a4", isRotated: false } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const strip = await canvas.findByRole("region", {
			name: "Key figures",
			hidden: true,
		});
		// The paper is narrower than 768 px, so a figure opens its card as a sheet.
		await userEvent.click(
			within(strip).getAllByRole("button", { hidden: true })[0],
		);
		const card = await waitFor(() =>
			screen.getByRole("dialog", { hidden: true }),
		);

		const expectedResult: string[] = [];

		const controls = [
			...canvas.getAllByRole("navigation", { hidden: true }),
			...canvas.getAllByRole("button", {
				name: /^(Export|Data|Sources|Where these numbers come from)$/,
				hidden: true,
			}),
			canvas.getByRole("contentinfo", { hidden: true }),
			card,
			...document.querySelectorAll<HTMLElement>('[data-slot="sheet-overlay"]'),
		];
		const result = controls
			.filter((control) => control.checkVisibility())
			.map(
				(control) =>
					control.getAttribute("aria-label") ?? control.textContent ?? "",
			);

		await expect(result).toEqual(expectedResult);
	},
};
