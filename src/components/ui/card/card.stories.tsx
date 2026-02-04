import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
	CardAction,
	CARD_SIZES,
} from "./card";
import { Button } from "../button";

/**
 * A `Card` is a layout container used to group related content.
 * Use a `Card` when you need to present related content as repeatable, scannable units—especially in lists or grids. Optionally, it can also allow a single, clear action per unit.
 * It can be interactive or non-interactive.
 */
const meta: Meta<typeof Card> = {
	title: "Components/Card",
	component: Card,
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: CARD_SIZES,
			description: "Size variant of the card",
		},
	},
	args: {
		size: "default",
	},
};

export default meta;
type Story = StoryObj<typeof Card>;

/**
 * Default interactive playground for the Card component.
 * Use the controls to explore different configurations.
 */
export const Playground: Story = {
	render: (args) => (
		<Card {...args} className="max-w-md">
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>
					This is a card description that provides context.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card content goes here. This is the main body of the card.</p>
			</CardContent>
			<CardFooter>
				<Button size="sm">Action</Button>
			</CardFooter>
		</Card>
	),
};

// ==========================================
// SIZE STORIES
// ==========================================

/**
 * Default size card - standard padding and spacing.
 */
export const Default: Story = {
	args: {
		size: "default",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
	render: (args) => (
		<Card {...args} className="max-w-md">
			<CardHeader>
				<CardTitle>Default Card</CardTitle>
				<CardDescription>A card with default size and spacing.</CardDescription>
			</CardHeader>
			<CardContent>
				<p>
					This card uses the default size with standard padding (16px) and gap
					spacing.
				</p>
			</CardContent>
			<CardFooter>
				<Button size="sm">Primary Action</Button>
				<Button size="sm" variant="outline" className="ml-auto">
					Secondary
				</Button>
			</CardFooter>
		</Card>
	),
};

/**
 * Small size card - compact padding and spacing.
 */
export const Small: Story = {
	args: {
		size: "sm",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
	render: (args) => (
		<Card {...args} className="max-w-md">
			<CardHeader>
				<CardTitle>Small Card</CardTitle>
				<CardDescription>A compact card with reduced spacing.</CardDescription>
			</CardHeader>
			<CardContent>
				<p>
					This card uses the small size with compact padding (12px) and gap
					spacing.
				</p>
			</CardContent>
			<CardFooter>
				<Button size="xs">Action</Button>
			</CardFooter>
		</Card>
	),
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

/**
 * Card with action button in header.
 */
export const WithHeaderAction: Story = {
	render: () => (
		<Card className="max-w-md">
			<CardHeader>
				<CardTitle>Notifications</CardTitle>
				<CardDescription>You have 3 unread messages.</CardDescription>
				<CardAction>
					<Button size="xs" variant="ghost">
						Mark all read
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<p className="text-sm">Message 1: New comment on your post</p>
					<p className="text-sm">Message 2: Someone liked your photo</p>
					<p className="text-sm">Message 3: You have a new follower</p>
				</div>
			</CardContent>
		</Card>
	),
};

/**
 * Card with only title and content (no description or footer).
 */
export const Simple: Story = {
	render: () => (
		<Card className="max-w-md">
			<CardHeader>
				<CardTitle>Simple Card</CardTitle>
			</CardHeader>
			<CardContent>
				<p>A minimal card with just a title and content section.</p>
			</CardContent>
		</Card>
	),
};

/**
 * Card with multiple content sections.
 */
export const MultipleContentSections: Story = {
	render: () => (
		<Card className="max-w-md">
			<CardHeader>
				<CardTitle>Project Overview</CardTitle>
				<CardDescription>Summary of project metrics and status</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<p className="text-sm font-medium">Status</p>
						<p className="text-sm text-muted-foreground">In Progress</p>
					</div>
					<div>
						<p className="text-sm font-medium">Due Date</p>
						<p className="text-sm text-muted-foreground">January 15, 2026</p>
					</div>
					<div>
						<p className="text-sm font-medium">Team Members</p>
						<p className="text-sm text-muted-foreground">5 active members</p>
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Button size="sm" variant="outline">
					View Details
				</Button>
			</CardFooter>
		</Card>
	),
};

/**
 * Size comparison - shows both card sizes side by side.
 */
export const SizeComparison: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div className="space-y-2">
				<Card size="default" className="max-w-md">
					<CardHeader>
						<CardTitle>Default Size</CardTitle>
						<CardDescription>Standard padding and spacing</CardDescription>
					</CardHeader>
					<CardContent>
						<p>
							This card demonstrates the default size with standard spacing.
						</p>
					</CardContent>
					<CardFooter>
						<Button size="sm">Action</Button>
					</CardFooter>
				</Card>
				<p className="text-xs text-muted-foreground text-center">
					size="default"
				</p>
			</div>

			<div className="space-y-2">
				<Card size="sm" className="max-w-md">
					<CardHeader>
						<CardTitle>Small Size</CardTitle>
						<CardDescription>Compact padding and spacing</CardDescription>
					</CardHeader>
					<CardContent>
						<p>This card demonstrates the small size with compact spacing.</p>
					</CardContent>
					<CardFooter>
						<Button size="xs">Action</Button>
					</CardFooter>
				</Card>
				<p className="text-xs text-muted-foreground text-center">size="sm"</p>
			</div>
		</div>
	),
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
