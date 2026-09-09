import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from ".";

/**
 * A `Tooltip` reveals extra detail about the element it wraps, on hover and on
 * keyboard focus. base-ui drives both triggers, so a mouse and the Tab key both
 * open it. Use it for a hint that helps but is not required to read the page,
 * such as the full name behind an abbreviated metric.
 *
 * The panel follows the app's class-based theme, so it repaints with the
 * Storybook theme toggle. `side` places it above, below, or beside the trigger
 * and flips to stay on screen.
 */
const meta: Meta<typeof Tooltip> = {
	title: "Components/Tooltip",
	component: Tooltip,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Hover the trigger or tab to it with the keyboard. Both open the same panel.
 */
export const Default: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger
				render={<Button variant="outline">Gross margin</Button>}
			/>
			<TooltipContent>Revenue minus cost of goods sold</TooltipContent>
		</Tooltip>
	),
};

/**
 * The four placements. One provider gives them a shared delay, so once one
 * opens the neighbours open at once.
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
