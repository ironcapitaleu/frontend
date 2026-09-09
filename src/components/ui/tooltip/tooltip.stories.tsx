import type { Meta, StoryObj } from "@storybook/react-vite";

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
