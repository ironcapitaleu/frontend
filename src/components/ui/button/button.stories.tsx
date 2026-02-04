import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import {
	VariantShowcase,
	SizeShowcase,
} from "../../../../.storybook/utils/showcaseDecorators";
import {
	Button,
	BUTTON_VARIANTS,
	BUTTON_TEXT_SIZES,
	BUTTON_ICON_SIZES,
} from "./button";

/**
  A `Button` is an interactive control used to trigger actions. Use them for primary/secondary/destructive actions (including icon-only buttons).
  For non-interactive status labels, use `Badge`.
 */
const meta: Meta<typeof Button> = {
	title: "Components/Button",
	component: Button,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: BUTTON_VARIANTS,
			description: "Visual style variant of the button",
		},
		size: {
			control: "select",
			options: BUTTON_TEXT_SIZES, // Only text button sizes for normal buttons
			description: "Size variant of the button",
		},
		disabled: {
			control: "boolean",
			description: "Whether the button is disabled",
		},
		children: {
			control: "text",
			description: "Button content",
		},
	},
	args: {
		children: "Button",
		variant: "default",
		size: "default",
	},
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default interactive playground for the Button component.
 * Use the controls to explore all variants and sizes.
 */
export const Playground: Story = {};

// ==========================================
// VARIANT STORIES
// ==========================================

/**
 * All button variants displayed together for comparison.
 * This is a visual showcase only - use Playground or individual variant stories for interactive testing.
 */
export const AllVariants: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<VariantShowcase
			Component={Button}
			variants={[...BUTTON_VARIANTS]}
			variantKey="variant"
			baseProps={{ children: "Button" }}
		/>
	),
};

export const Default: Story = {
	args: {
		variant: "default",
		children: "Default Button",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Delete",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Outline Button",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary Button",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Ghost: Story = {
	args: {
		variant: "ghost",
		children: "Ghost Button",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Link: Story = {
	args: {
		variant: "link",
		children: "Link Button",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

// ==========================================
// SIZE STORIES
// ==========================================

/**
 * All button sizes displayed together for comparison.
 * This is a visual showcase only - use Playground or individual size stories for interactive testing.
 */
export const AllSizes: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<SizeShowcase
			Component={Button}
			sizes={[...BUTTON_TEXT_SIZES]}
			sizeKey="size"
			baseProps={{ children: "Button" }}
		/>
	),
};

export const ExtraSmall: Story = {
	args: {
		size: "xs",
		children: "Extra Small",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Small",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Large",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

// ==========================================
// STATE STORIES
// ==========================================

/**
 * Disabled state across all variants.
 * This is a visual showcase only - demonstrates the disabled state for each variant.
 */
export const DisabledStates: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="space-y-4">
			{BUTTON_VARIANTS.map((variant) => (
				<div key={variant} className="flex items-center gap-4">
					<Button variant={variant}>Normal</Button>
					<Button variant={variant} disabled>
						Disabled
					</Button>
					<span className="text-sm text-muted-foreground capitalize">
						{variant}
					</span>
				</div>
			))}
		</div>
	),
};

// ==========================================
// ICON BUTTON STORIES
// ==========================================

/**
 * Icon-only button sizes comparison.
 * This is a visual showcase only - demonstrates icon button size variants.
 */
export const IconSizes: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<SizeShowcase
			Component={Button}
			sizes={[...BUTTON_ICON_SIZES]}
			sizeKey="size"
			baseProps={{ children: "✕", "aria-label": "Close" }}
		/>
	),
};

// ==========================================
// INTERACTIVE EXAMPLES
// ==========================================

// Interactive Button
function InteractiveButtonExample({
	size = "default",
}: {
	size?: (typeof BUTTON_TEXT_SIZES)[number];
}) {
	const [count, setCount] = useState(0);

	const isDisabled = count >= 10;
	const variant = count >= 7 ? "destructive" : "default";

	const label = isDisabled
		? "Limit reached"
		: count === 0
			? "Click me"
			: `Clicked ${count} time${count === 1 ? "" : "s"}`;

	return (
		<div className="flex flex-col items-start gap-2">
			<Button
				size={size}
				variant={variant}
				disabled={isDisabled}
				onClick={() => setCount((prev) => prev + 1)}
			>
				{label}
			</Button>

			<p className="text-sm text-muted-foreground">
				Clicks: {count} (turns destructive at 7, disables at 10)
			</p>
		</div>
	);
}

/**
 * Minimal interactive example:
 * - Clicks increment a counter
 * - Visual feedback via label + variant change
 * - Disables itself after 10 clicks
 */
export const Interactive: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => <InteractiveButtonExample />,
};

// Interactive Button with click log (as text below)
function InteractiveButtonWithLogExample({
	size = "default",
}: {
	size?: (typeof BUTTON_TEXT_SIZES)[number];
}) {
	const [count, setCount] = useState(0);
	const [events, setEvents] = useState<string[]>([]);

	const isDisabled = count >= 10;
	const variant = count >= 7 ? "destructive" : "default";

	const label = isDisabled
		? "Limit reached"
		: count === 0
			? "Click me"
			: `Clicked ${count} time${count === 1 ? "" : "s"}`;

	return (
		<div className="flex flex-col items-start gap-2">
			<Button
				size={size}
				variant={variant}
				disabled={isDisabled}
				onClick={() => {
					setCount((prev) => prev + 1);
					setEvents((prev) => [`click #${prev.length + 1}`, ...prev]);
				}}
			>
				{label}
			</Button>

			<p className="text-sm text-muted-foreground">
				Clicks: {count} (turns destructive at 7, disables at 10)
			</p>

			<div className="w-full">
				<p className="text-sm font-medium">Click log</p>
				{events.length === 0 ? (
					<p className="text-sm text-muted-foreground">No clicks yet</p>
				) : (
					<ol className="text-sm text-muted-foreground list-decimal pl-5">
						{events.slice(0, 5).map((event) => (
							<li key={event}>{event}</li>
						))}
					</ol>
				)}
			</div>
		</div>
	);
}

/**
 * Same as `Interactive`, but also renders a small click log.
 * Useful as a baseline for “did my click handler fire?” stories.
 */
export const InteractiveWithLog: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => <InteractiveButtonWithLogExample />,
};

// Interactive Button that logs click events to Storybook Actions
function InteractiveButtonWithActionsExample({
	size = "default",
	onClick,
}: {
	size?: (typeof BUTTON_TEXT_SIZES)[number];
	onClick?: ComponentProps<typeof Button>["onClick"];
}) {
	const [count, setCount] = useState(0);

	const isDisabled = count >= 10;
	const variant = count >= 7 ? "destructive" : "default";

	const label = isDisabled
		? "Limit reached"
		: count === 0
			? "Click me"
			: `Clicked ${count} time${count === 1 ? "" : "s"}`;

	return (
		<div className="flex flex-col items-start gap-2">
			<Button
				size={size}
				variant={variant}
				disabled={isDisabled}
				onClick={(event) => {
					setCount((prev) => prev + 1);
					onClick?.(event);
				}}
			>
				{label}
			</Button>

			<p className="text-sm text-muted-foreground">
				Clicks: {count} (turns destructive at 7, disables at 10)
			</p>
		</div>
	);
}

/**
 * Same as `Interactive`, but logs each click to the Storybook Actions panel.
 */
export const InteractiveWithActions: Story = {
	name: "InteractiveWithActions",
	parameters: {
		controls: { disable: true },
	},
	argTypes: {
		onClick: { action: "clicked" },
	},
	render: (args) => (
		<InteractiveButtonWithActionsExample onClick={args.onClick} />
	),
};

/**
 * Logs clicks to the Actions panel AND runs a small interaction via `play`.
 * Useful as a baseline for CI interaction testing.
 */
export const InteractiveWithActionsPlayable: Story = {
	name: "InteractiveWithActionsPlayable",
	parameters: {
		controls: { disable: true },
	},
	argTypes: {
		onClick: { action: "clicked" },
	},
	render: (args) => (
		<InteractiveButtonWithActionsExample onClick={args.onClick} />
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button", { name: /click me/i });

		await userEvent.click(button);
		await userEvent.click(button);
		await userEvent.click(button);

		await expect(button).toHaveTextContent("Clicked 3 times");
		await expect(canvas.getByText(/Clicks:\s*3/i)).toBeVisible();
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
