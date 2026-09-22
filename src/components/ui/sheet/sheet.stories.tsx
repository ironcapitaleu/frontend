import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "../button";
import {
	SHEET_SIDES,
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from ".";

/**
 * A `Sheet` slides a panel in from an edge over a dimmed page. It is a modal
 * dialog built on base-ui: focus moves into the panel and stays there, and
 * Escape or a click on the backdrop closes it.
 *
 * The panel uses the `background` surface with a hairline on its inner edge,
 * and it casts the one shadow a floating surface earns. The screener uses a
 * right sheet for the company preview and a left sheet for the filters on a
 * phone.
 */
const meta: Meta<typeof SheetContent> = {
	title: "Components/Sheet",
	component: SheetContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		side: {
			control: "inline-radio",
			options: SHEET_SIDES,
			description: "The edge the panel enters from.",
		},
		showCloseButton: {
			control: "boolean",
			description: "Whether the close button shows in the top-right corner.",
		},
		className: { control: { disable: true } },
	},
	args: {
		side: "right",
		showCloseButton: true,
	},
	render: (args) => (
		<Sheet>
			<SheetTrigger
				render={<Button variant="outline" className="btn-tactile" />}
			>
				Open sheet
			</SheetTrigger>
			<SheetContent {...args}>
				<SheetBody className="flex flex-col gap-2 pr-16">
					<SheetTitle className="font-classic text-4xl">Bayer AG</SheetTitle>
					<SheetDescription>
						A preview of the company, with the page still in view.
					</SheetDescription>
				</SheetBody>
			</SheetContent>
		</Sheet>
	),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The trigger opens a right sheet. Change the side in the Controls panel. */
export const Playground: Story = {};

/** A left sheet, as the screener uses for its filters on a phone. */
export const Left: Story = {
	args: { side: "left" },
};

/** A bottom sheet, capped at 85% of the screen height. */
export const Bottom: Story = {
	args: { side: "bottom" },
};

/**
 * The trigger opens the sheet and focus moves inside it. Escape closes it
 * again and hands focus back to the trigger.
 */
export const OpensAndClosesWithEscape: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole("button", { name: "Open sheet" });

		const expectedResult = {
			focusInsideWhenOpen: true,
			dialogAfterEscape: null,
			focusAfterEscape: "Open sheet",
		};

		await userEvent.click(trigger);
		const dialog = await page.findByRole("dialog", { name: "Bayer AG" });
		await waitFor(() => {
			if (!dialog.contains(document.activeElement)) throw new Error("focus");
		});
		const focusInsideWhenOpen = dialog.contains(document.activeElement);
		await userEvent.keyboard("{Escape}");
		await waitFor(() => {
			if (page.queryByRole("dialog")) throw new Error("still open");
		});
		const result = {
			focusInsideWhenOpen,
			dialogAfterEscape: page.queryByRole("dialog"),
			focusAfterEscape: document.activeElement?.textContent,
		};

		await expect(result).toEqual(expectedResult);
	},
};
