import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import * as React from "react";

import {
	BoldIcon,
	ItalicIcon,
	UnderlineIcon,
	AlignLeftIcon,
	AlignCenterIcon,
	AlignRightIcon,
	AlignJustifyIcon,
	BookmarkIcon,
	HeartIcon,
	StarIcon,
} from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

type ToggleGroupVariant = "default" | "outline";
type ToggleGroupSize = "sm" | "default" | "lg";

const TOGGLE_GROUP_VARIANTS = [
	"default",
	"outline",
] as const satisfies readonly ToggleGroupVariant[];
const TOGGLE_GROUP_SIZES = [
	"sm",
	"default",
	"lg",
] as const satisfies readonly ToggleGroupSize[];

type ToggleGroupStoryArgs = ComponentProps<typeof ToggleGroup> & {
	variant: ToggleGroupVariant;
	size: ToggleGroupSize;
	multiple: boolean;
	disabled: boolean;
};

function ToggleGroupStory({
	variant,
	size,
	multiple,
	disabled,
	...props
}: ToggleGroupStoryArgs) {
	return (
		<ToggleGroup
			{...props}
			variant={variant}
			size={size}
			multiple={multiple}
			disabled={disabled}
		>
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<BoldIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<ItalicIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<UnderlineIcon />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

/**
 * A `Toggle Group` is a component that groups multiple `Toggle` components together to allow users to select one or more related options.
 * Use a `Toggle Group` when you want users to choose between a small set of related options, such as view modes or formatting controls, where immediate feedback is expected.
 * `Toggle Group`s are inherently interactive elements, as users actively select or deselect options within the group.
 */
const meta: Meta<ToggleGroupStoryArgs> = {
	title: "Components/Toggle Group",
	component: ToggleGroupStory,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	args: {
		variant: "default",
		size: "default",
		multiple: true,
		disabled: false,
		spacing: 0,
		orientation: "horizontal",
	},
	argTypes: {
		variant: { control: "select", options: TOGGLE_GROUP_VARIANTS },
		size: { control: "select", options: TOGGLE_GROUP_SIZES },
		multiple: { control: "boolean" },
		disabled: { control: "boolean" },
		spacing: { control: { type: "range", min: 0, max: 4, step: 1 } },
		orientation: {
			control: "inline-radio",
			options: ["horizontal", "vertical"],
		},
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
 * Interactive playground for ToggleGroup.
 */
export const Playground: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
};

// ==========================================
// VARIANT STORIES
// ==========================================

export const Default: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		variant: "default",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Outline: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		variant: "outline",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

// ==========================================
// SIZE STORIES
// ==========================================

export const Small: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		size: "sm",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

export const Large: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		size: "lg",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

// ==========================================
// TYPE STORIES
// ==========================================

export const Single: Story = {
	render: () => (
		<ToggleGroup multiple={false} variant="outline">
			<ToggleGroupItem value="left" aria-label="Align left">
				<AlignLeftIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="center" aria-label="Align center">
				<AlignCenterIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="right" aria-label="Align right">
				<AlignRightIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="justify" aria-label="Align justify">
				<AlignJustifyIcon />
			</ToggleGroupItem>
		</ToggleGroup>
	),
	parameters: {
		controls: { disable: true },
	},
};

export const Multiple: Story = {
	render: () => (
		<ToggleGroup multiple={true} variant="outline">
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<BoldIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<ItalicIcon />
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<UnderlineIcon />
			</ToggleGroupItem>
		</ToggleGroup>
	),
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// ORIENTATION STORIES
// ==========================================

export const Vertical: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		orientation: "vertical",
		variant: "outline",
	},
	argTypes: {
		orientation: { control: { disable: true } },
	},
};

// ==========================================
// SPACING STORIES
// ==========================================

export const WithSpacing: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		spacing: 1,
		variant: "outline",
	},
	argTypes: {
		spacing: { control: { disable: true } },
	},
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: (args) => <ToggleGroupStory {...args} />,
	args: {
		disabled: true,
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

// ==========================================
// INTERACTIVE EXAMPLES
// ==========================================

export const FilledIcons: Story = {
	render: () => (
		<ToggleGroup multiple={true} variant="outline" size="sm">
			<ToggleGroupItem
				value="star"
				aria-label="Toggle star"
				className="aria-pressed:bg-transparent"
			>
				<StarIcon className="group-aria-pressed/toggle:fill-yellow-500 group-aria-pressed/toggle:stroke-yellow-500 transition-colors" />
				Star
			</ToggleGroupItem>
			<ToggleGroupItem
				value="heart"
				aria-label="Toggle heart"
				className="aria-pressed:bg-transparent"
			>
				<HeartIcon className="group-aria-pressed/toggle:fill-red-500 group-aria-pressed/toggle:stroke-red-500 transition-colors" />
				Heart
			</ToggleGroupItem>
			<ToggleGroupItem
				value="bookmark"
				aria-label="Toggle bookmark"
				className="aria-pressed:bg-transparent"
			>
				<BookmarkIcon className="group-aria-pressed/toggle:fill-blue-500 group-aria-pressed/toggle:stroke-blue-500 transition-colors" />
				Bookmark
			</ToggleGroupItem>
		</ToggleGroup>
	),
	parameters: {
		controls: { disable: true },
	},
};

export const Controlled: Story = {
	render: () => {
		const [value, setValue] = React.useState<string[]>(["bold"]);

		return (
			<div className="max-w-xl space-y-3">
				<ToggleGroup
					multiple={true}
					value={value}
					onValueChange={(newValue) => setValue(newValue as string[])}
					variant="outline"
				>
					<ToggleGroupItem value="bold" aria-label="Toggle bold">
						<BoldIcon />
					</ToggleGroupItem>
					<ToggleGroupItem value="italic" aria-label="Toggle italic">
						<ItalicIcon />
					</ToggleGroupItem>
					<ToggleGroupItem value="underline" aria-label="Toggle underline">
						<UnderlineIcon />
					</ToggleGroupItem>
				</ToggleGroup>

				<p className="text-sm text-muted-foreground">
					Selected: {value.length > 0 ? value.join(", ") : "none"}
				</p>
			</div>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
