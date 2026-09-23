import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
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

// The panel's props, plus whether the story opens the sheet on mount.
type SheetStoryArgs = ComponentProps<typeof SheetContent> & {
	defaultOpen?: boolean;
};

/**
 * A `Sheet` slides a panel in from an edge over a dimmed page. It is a modal
 * dialog built on base-ui: focus moves into the panel and stays there, and
 * Escape or a click on the backdrop closes it.
 *
 * The panel uses the `background` surface with a hairline on its inner edge,
 * and it casts the one shadow a floating surface earns. Below the `sm`
 * breakpoint a side panel fills the screen width.
 */

const meta: Meta<SheetStoryArgs> = {
	title: "Components/Sheet",
	component: SheetContent,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
		// Every story mounts open, so the docs page gives each one its own
		// frame. Inline, the modal sheets stack and lock the page scroll.
		docs: { story: { inline: false, iframeHeight: 480 } },
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
		defaultOpen: {
			control: "boolean",
			description: "Whether the story opens the sheet on mount.",
		},
		className: { control: { disable: true } },
	},
	args: {
		side: "right",
		showCloseButton: true,
		defaultOpen: true,
	},
	render: ({ defaultOpen, ...args }) => (
		<Sheet defaultOpen={defaultOpen}>
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

/** A right sheet, open on mount. Change the side in the Controls panel. */
export const Playground: Story = {};

/** A left sheet, for a filter panel on a phone. */
export const Left: Story = {
	args: { side: "left" },
};

/** A bottom sheet, capped at 85% of the screen height. */
export const Bottom: Story = {
	args: { side: "bottom" },
};

/** Without the corner close button. Escape and the backdrop still close it. */
export const WithoutCloseButton: Story = {
	args: { showCloseButton: false },
};

/** A phone width. The right panel fills the screen width. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};

/** A click on the backdrop closes the sheet. */
export const ClosesOnBackdropClick: Story = {
	args: { defaultOpen: false },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(canvasElement.ownerDocument.body);

		const expectedResult = null;

		await userEvent.click(canvas.getByRole("button", { name: "Open sheet" }));
		await page.findByRole("dialog", { name: "Bayer AG" });
		// Deviation from TESTING.md §2.2: the backdrop has no role or name, so a
		// data-slot query reaches it.
		const backdrop = canvasElement.ownerDocument.querySelector(
			'[data-slot="sheet-overlay"]',
		) as HTMLElement;
		await userEvent.click(backdrop);
		await waitFor(() => {
			if (page.queryByRole("dialog")) throw new Error("still open");
		});
		const result = page.queryByRole("dialog");

		await expect(result).toBe(expectedResult);
	},
};

/**
 * The trigger opens the sheet and focus moves inside it. Escape closes it
 * again and hands focus back to the trigger.
 */
export const OpensAndClosesWithEscape: Story = {
	args: { defaultOpen: false },
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
