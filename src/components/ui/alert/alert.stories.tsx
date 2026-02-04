import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button, BUTTON_VARIANTS } from "../button";

type AlertVariant = "default" | "destructive";
const ALERT_VARIANTS = [
	"default",
	"destructive",
] as const satisfies readonly AlertVariant[];

type AlertStoryArgs = ComponentProps<typeof Alert> & {
	title: string;
	description: string;
	variant: AlertVariant;
	showIcon: boolean;
	showAction: boolean;
	actionLabel: string;
	actionVariant: (typeof BUTTON_VARIANTS)[number];
	showLink: boolean;
};

function AlertStory({
	title,
	description,
	variant,
	showIcon,
	showAction,
	actionLabel,
	actionVariant,
	showLink,
	...props
}: AlertStoryArgs) {
	return (
		<div className="max-w-xl">
			<Alert {...props} variant={variant}>
				{showIcon ? <AlertCircleIcon /> : null}
				<AlertTitle>{title}</AlertTitle>
				<AlertDescription>
					<p>{description}</p>
					{showLink ? (
						<p>
							<button type="button" className="underline">
								Learn more
							</button>
						</p>
					) : null}
				</AlertDescription>
				{showAction ? (
					<AlertAction>
						<Button size="xs" variant={actionVariant}>
							{actionLabel}
						</Button>
					</AlertAction>
				) : null}
			</Alert>
		</div>
	);
}

/**
 * An `Alert` is a component that communicates important information, warnings, errors, or confirmations to the user.
 * Use an `Alert` when you need to draw attention to critical or time-sensitive messages, such as errors, success feedback, system notices, or required actions. It is different from an `AlertDialog`, which requires user interaction to proceed. An`Alert` passively informs the user without blocking interaction, while an `AlertDialog` interrupts the flow and requires an explicit user decision before continuing.
 * An `Alert` is generally non-interactive, but it may include interactive elements like dismiss buttons or action links when user response is needed.
 */
const meta: Meta<typeof AlertStory> = {
	title: "Components/Alert",
	component: AlertStory,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	args: {
		variant: "default",
		title: "Heads up!",
		description: "This is an alert with some additional context.",
		showIcon: true,
		showAction: false,
		actionLabel: "Undo",
		actionVariant: "outline",
		showLink: false,
	},
	argTypes: {
		variant: { control: "select", options: ALERT_VARIANTS },
		title: { control: "text" },
		description: { control: "text" },
		showIcon: { control: "boolean" },
		showAction: { control: "boolean" },
		actionLabel: { control: "text" },
		actionVariant: { control: "select", options: BUTTON_VARIANTS },
		showLink: { control: "boolean" },
		children: { control: { disable: true } },
		className: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for the Alert component.
 */
export const Playground: Story = {
	render: (args) => <AlertStory {...args} />,
};

// ==========================================
// VARIANT STORIES
// ==========================================

export const Default: Story = {
	render: (args) => <AlertStory {...args} />,
	args: {
		variant: "default",
		title: "Heads up!",
		description: "This is the default alert variant.",
		showIcon: true,
		showAction: false,
		showLink: false,
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Destructive: Story = {
	render: (args) => <AlertStory {...args} />,
	args: {
		variant: "destructive",
		title: "Something went wrong",
		description:
			"There was a problem processing your request. Please try again.",
		showIcon: true,
		showAction: false,
		showLink: false,
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const WithoutIcon: Story = {
	render: (args) => <AlertStory {...args} />,
	args: {
		variant: "default",
		title: "Notice",
		description: "This alert renders without an icon.",
		showIcon: false,
	},
	argTypes: {
		variant: { control: { disable: true } },
		showIcon: { control: { disable: true } },
	},
};

// ==========================================
// WITH INTERACTIVITY ELEMENT EXAMPLES
// ==========================================

export const WithAction: Story = {
	render: (args) => <AlertStory {...args} />,
	args: {
		variant: "default",
		title: "Update available",
		description: "A new version is ready. You can apply it now or later.",
		showIcon: true,
		showAction: true,
		actionLabel: "Update",
		actionVariant: "default",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const WithLink: Story = {
	render: (args) => <AlertStory {...args} />,
	args: {
		variant: "default",
		title: "FYI",
		description: "This alert includes a link inside the description.",
		showIcon: true,
		showLink: true,
	},
	argTypes: {
		variant: { control: { disable: true } },
		showLink: { control: { disable: true } },
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
