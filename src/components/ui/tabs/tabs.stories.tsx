import type { Meta, StoryObj } from "@storybook/react-vite";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	tabsListVariants,
} from "./tabs";

type TabsStoryArgs = {
	listVariant: NonNullable<Parameters<typeof tabsListVariants>[0]>["variant"];
	orientation: "horizontal" | "vertical";
	defaultValue: "account" | "password" | "settings";
	disableSettings: boolean;
};

/**
 * `Tabs` are a navigation component that organize related content into multiple panels, allowing users to switch between views within the same context.
 * Use `Tabs` when you need to group related content or settings into separate sections without navigating away from the page, such as profile sections, settings categories, or dashboards.
 * `Tabs` are interactive, as users actively select tabs to change the visible content.
 */
const meta: Meta<TabsStoryArgs> = {
	title: "Components/Tabs",
	component: Tabs,
	tags: ["autodocs"],
	args: {
		listVariant: "default",
		orientation: "horizontal",
		defaultValue: "account",
		disableSettings: false,
	},
	argTypes: {
		listVariant: { control: "inline-radio", options: ["default", "line"] },
		orientation: {
			control: "inline-radio",
			options: ["horizontal", "vertical"],
		},
		defaultValue: {
			control: "inline-radio",
			options: ["account", "password", "settings"],
		},
		disableSettings: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<TabsStoryArgs>;

function TabsStory({
	listVariant,
	orientation,
	defaultValue,
	disableSettings,
}: TabsStoryArgs) {
	return (
		<div className="max-w-xl">
			<Tabs defaultValue={defaultValue} orientation={orientation}>
				<TabsList variant={listVariant}>
					<TabsTrigger value="account">Account</TabsTrigger>
					<TabsTrigger value="password">Password</TabsTrigger>
					<TabsTrigger value="settings" disabled={disableSettings}>
						Settings
					</TabsTrigger>
				</TabsList>

				<TabsContent value="account">
					<div className="rounded-lg border p-4">
						<div className="text-sm font-medium">Account</div>
						<p className="mt-1 text-sm text-muted-foreground">
							Manage your account details.
						</p>
					</div>
				</TabsContent>

				<TabsContent value="password">
					<div className="rounded-lg border p-4">
						<div className="text-sm font-medium">Password</div>
						<p className="mt-1 text-sm text-muted-foreground">
							Update your password settings.
						</p>
					</div>
				</TabsContent>

				<TabsContent value="settings">
					<div className="rounded-lg border p-4">
						<div className="text-sm font-medium">Settings</div>
						<p className="mt-1 text-sm text-muted-foreground">
							Configure preferences for your workspace.
						</p>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

/**
 * Interactive playground for the Tabs component.
 * Use the controls to explore list variants, orientation, and default selection.
 */

// ==========================================
// PLAYGROUND
// ==========================================

export const Playground: Story = {
	render: (args) => <TabsStory {...args} />,
};

// ==========================================
// VARIANT STORIES
// ==========================================

/**
 * Default pill-style tabs.
 */
export const Default: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: (args) => <TabsStory {...args} />,
	args: {
		listVariant: "default",
	},
};

/**
 * Line variant highlights the active tab with an indicator.
 */
export const Line: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: (args) => <TabsStory {...args} />,
	args: {
		listVariant: "line",
	},
};

// ==========================================
// ORIENTATION STORIES
// ==========================================

/**
 * Vertical tabs are useful for sidebar navigation patterns.
 */
export const Vertical: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: (args) => <TabsStory {...args} />,
	args: {
		orientation: "vertical",
		listVariant: "line",
	},
};

// ==========================================
// STATE STORIES
// ==========================================

/**
 * Demonstrates a disabled tab trigger.
 */
export const DisabledSettingsTab: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: (args) => <TabsStory {...args} />,
	args: {
		disableSettings: true,
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
