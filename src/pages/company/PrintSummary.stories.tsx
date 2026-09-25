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
];

/**
 * The Overview of MRDN as the browser prints it (DESIGN.md §8 "Print
 * Summary"). Each story renders the page in the site layout at print media,
 * with the printable area of A4 or Letter paper as its viewport. The printed
 * page shows regions 1 to 3 and hides the controls of the screen.
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

/** Reads the printed region headings and whether the page fits the paper's width and height. */
async function readPrintedPage(canvasElement: HTMLElement) {
	await waitFor(() =>
		within(canvasElement).getByRole("heading", {
			name: "Checks by area",
			hidden: true,
		}),
	);
	return {
		regions: [
			...printed(canvasElement, "heading", 1),
			...printed(canvasElement, "heading", 2),
		].map(({ textContent }) => textContent),
		fitsWidth:
			document.documentElement.scrollWidth <=
			document.documentElement.clientWidth,
		fitsHeight:
			document.documentElement.scrollHeight <=
			document.documentElement.clientHeight,
	};
}

/** Regions 1 to 3 on the printable area of A4 paper, on one page. */
export const PrintedOnA4: Story = {
	globals: { viewport: { value: "a4", isRotated: false } },
	play: async ({ canvasElement }) => {
		const expectedResult = {
			regions: REGIONS,
			fitsWidth: true,
			fitsHeight: true,
		};

		const result = await readPrintedPage(canvasElement);

		await expect(result).toEqual(expectedResult);
	},
};

/**
 * Regions 1 to 3 on the printable area of Letter paper. They are 28 px taller
 * than one Letter page (DESIGN.md §8 "Print Summary"), which STA-260 settles,
 * so this story checks the regions and the width only.
 */
export const PrintedOnLetter: Story = {
	globals: { viewport: { value: "letter", isRotated: false } },
	play: async ({ canvasElement }) => {
		const expectedResult = { regions: REGIONS, fitsWidth: true };

		const { fitsHeight: _, ...result } = await readPrintedPage(canvasElement);

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
