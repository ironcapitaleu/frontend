import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from ".";

type TooltipStoryArgs = {
	side: "top" | "right" | "bottom" | "left";
	align: "start" | "center" | "end";
	sideOffset: number;
	delay: number;
};

/**
 * A `Tooltip` reveals extra detail about the element it wraps, on hover and on
 * keyboard focus. base-ui drives both triggers, so a mouse and the Tab key both
 * open it. Use it for a hint that helps but is not required to read the page,
 * such as the full name behind an abbreviated metric.
 *
 * The panel follows the app's class-based theme, so it repaints with the
 * Storybook theme toggle. `side` places it above, below, or beside the trigger
 * and flips to stay on screen, `align` shifts it along that side, and `delay`
 * sets the shared hover wait in milliseconds.
 */
const meta: Meta<TooltipStoryArgs> = {
	title: "Components/Tooltip",
	component: Tooltip,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		side: {
			control: "inline-radio",
			options: ["top", "right", "bottom", "left"],
			description: "Which side of the trigger the panel opens on.",
		},
		align: {
			control: "inline-radio",
			options: ["start", "center", "end"],
			description: "How the panel aligns along its side.",
		},
		sideOffset: {
			control: { type: "number", min: 0, max: 24, step: 1 },
			description: "Gap in pixels between the trigger and the panel.",
		},
		delay: {
			control: { type: "number", min: 0, max: 1000, step: 50 },
			description: "Shared hover wait in milliseconds before the panel opens.",
		},
	},
	args: {
		side: "top",
		align: "center",
		sideOffset: 8,
		delay: 300,
	},
};

export default meta;
type Story = StoryObj<TooltipStoryArgs>;

/**
 * Drive the placement and timing from the Controls panel. Hover the trigger or
 * tab to it with the keyboard. Both open the same panel.
 */
export const Default: Story = {
	render: ({ side, align, sideOffset, delay }) => (
		<TooltipProvider delay={delay}>
			<Tooltip>
				<TooltipTrigger
					render={<Button variant="outline">Gross margin</Button>}
				/>
				<TooltipContent side={side} align={align} sideOffset={sideOffset}>
					Revenue minus cost of goods sold
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

/**
 * Play test: a non-default `sideOffset` widens the gap between the trigger and
 * the panel. jsdom runs no layout, so this gap is measured in a real browser by
 * the storybook project.
 */
export const SideOffsetGap: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<TooltipProvider delay={0}>
			<Tooltip>
				<TooltipTrigger
					render={<Button variant="outline">Gross margin</Button>}
				/>
				<TooltipContent side="top" sideOffset={20}>
					Revenue minus cost of goods sold
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
	play: async ({ canvasElement }) => {
		const trigger = within(canvasElement).getByRole("button");
		trigger.focus();
		await screen.findByText("Revenue minus cost of goods sold");

		// 16 sits above the default gap of 8 and below the configured 20, so it
		// distinguishes the non-default offset with room for rounding.
		const expectedMinimumGap = 16;

		await waitFor(() => {
			const popup = screen
				.getByText("Revenue minus cost of goods sold")
				.closest("[data-side]");
			const side = popup?.getAttribute("data-side");
			const t = trigger.getBoundingClientRect();
			const p = (popup ?? trigger).getBoundingClientRect();
			const gap =
				side === "top"
					? t.top - p.bottom
					: side === "bottom"
						? p.top - t.bottom
						: side === "left"
							? t.left - p.right
							: p.left - t.right;

			expect(Math.round(gap)).toBeGreaterThanOrEqual(expectedMinimumGap);
		});
	},
};

/**
 * The four placements side by side. One provider gives them a shared delay, so
 * once one opens the neighbours open at once.
 */
export const Placements: Story = {
	render: () => (
		<TooltipProvider>
			<div className="flex items-center gap-4">
				<Tooltip>
					<TooltipTrigger render={<Button variant="outline">Top</Button>} />
					<TooltipContent side="top">Placed above the trigger</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger render={<Button variant="outline">Right</Button>} />
					<TooltipContent side="right">
						Placed to the right of the trigger
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger render={<Button variant="outline">Bottom</Button>} />
					<TooltipContent side="bottom">
						Placed below the trigger
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger render={<Button variant="outline">Left</Button>} />
					<TooltipContent side="left">
						Placed to the left of the trigger
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	),
};
