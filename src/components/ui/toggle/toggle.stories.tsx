import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import * as React from "react";

import {
	VariantShowcase,
	SizeShowcase,
} from "../../../../.storybook/utils/showcaseDecorators";
import {
	BoldIcon,
	ItalicIcon,
	UnderlineIcon,
	BookmarkIcon,
} from "lucide-react";

import { Toggle } from "./toggle";

type ToggleVariant = "default" | "outline";
type ToggleSize = "sm" | "default" | "lg";

const TOGGLE_VARIANTS = [
	"default",
	"outline",
] as const satisfies readonly ToggleVariant[];
const TOGGLE_SIZES = [
	"sm",
	"default",
	"lg",
] as const satisfies readonly ToggleSize[];

type ToggleStoryArgs = ComponentProps<typeof Toggle> & {
	label: string;
	icon: "none" | "bold" | "italic" | "underline" | "bookmark";
};

function ToggleStory({ label, icon, ...props }: ToggleStoryArgs) {
	return (
		<Toggle {...props} aria-label={!label ? "Toggle" : undefined}>
			{icon === "bold" ? <BoldIcon /> : null}
			{icon === "italic" ? <ItalicIcon /> : null}
			{icon === "underline" ? <UnderlineIcon /> : null}
			{icon === "bookmark" ? (
				<BookmarkIcon className="transition-colors group-data-[state=on]/toggle:fill-current group-data-[state=on]/toggle:stroke-current" />
			) : null}
			{label}
		</Toggle>
	);
}

/**
 * A `Toggle` is an interactive control that allows users to turn a single setting `on` or `off`, representing a binary state.
 * Use a `Toggle` when a setting takes effect immediately and has only **two possible states**, such as enabling notifications or dark mode.
 * A `Toggle` is inherently interactive, as users have to actively switch between `on` and `off` states.
 */
const meta: Meta<ToggleStoryArgs> = {
	title: "Components/Toggle",
	component: ToggleStory,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
	args: {
		label: "",
		icon: "bold",
		variant: "default",
		size: "default",
		disabled: false,
		defaultPressed: false,
	},
	argTypes: {
		label: { control: "text" },
		icon: {
			control: "inline-radio",
			options: ["none", "bold", "italic", "underline", "bookmark"],
		},
		variant: { control: "select", options: TOGGLE_VARIANTS },
		size: { control: "select", options: TOGGLE_SIZES },
		disabled: { control: "boolean" },
		defaultPressed: { control: "boolean" },
		pressed: { control: { disable: true } },
		onPressedChange: { control: { disable: true } },
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
 * Interactive playground for Toggle.
 */
export const Playground: Story = {
	render: (args) => <ToggleStory {...args} />,
};

// ==========================================
// VARIANT STORIES
// ==========================================

export const AllVariants: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="max-w-xl">
			<VariantShowcase
				Component={ToggleStory}
				variants={[...TOGGLE_VARIANTS]}
				variantKey="variant"
				baseProps={{ label: "", icon: "bold" }}
			/>
		</div>
	),
};

export const Default: Story = {
	render: (args) => <ToggleStory {...args} />,
	args: {
		variant: "default",
		label: "",
		icon: "bold",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Outline: Story = {
	render: (args) => <ToggleStory {...args} />,
	args: {
		variant: "outline",
		label: "",
		icon: "italic",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const WithText: Story = {
	render: (args) => <ToggleStory {...args} />,
	args: {
		variant: "default",
		label: "Bold",
		icon: "bold",
	},
	argTypes: {
		variant: { control: { disable: true } },
	},
};

export const Bookmark: Story = {
	render: () => (
		<Toggle
			aria-label="Toggle bookmark"
			size="sm"
			variant="outline"
			className="aria-pressed:bg-transparent"
		>
			<BookmarkIcon className="group-aria-pressed/toggle:fill-blue-500 group-aria-pressed/toggle:stroke-blue-500 transition-colors" />
			Bookmark
		</Toggle>
	),
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// SIZE STORIES
// ==========================================

export const AllSizes: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="max-w-xl">
			<SizeShowcase
				Component={ToggleStory}
				sizes={[...TOGGLE_SIZES]}
				sizeKey="size"
				baseProps={{ label: "", icon: "bold" }}
			/>
		</div>
	),
};

export const Small: Story = {
	render: (args) => <ToggleStory {...args} />,
	args: {
		size: "sm",
		label: "",
		icon: "italic",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

export const Large: Story = {
	render: (args) => <ToggleStory {...args} />,
	args: {
		size: "lg",
		label: "",
		icon: "italic",
	},
	argTypes: {
		size: { control: { disable: true } },
	},
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: (args) => <ToggleStory {...args} />,
	args: {
		label: "",
		disabled: true,
		icon: "underline",
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

// ==========================================
// INTERACTIVE EXAMPLES
// ==========================================

export const Controlled: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const [bold, setBold] = React.useState(false);
		const [italic, setItalic] = React.useState(true);
		const [underline, setUnderline] = React.useState(false);

		return (
			<div className="max-w-xl space-y-3">
				<div className="flex items-center gap-2">
					<Toggle
						pressed={bold}
						onPressedChange={(next) => setBold(next)}
						aria-label="Toggle bold"
					>
						<BoldIcon />
					</Toggle>
					<Toggle
						pressed={italic}
						onPressedChange={(next) => setItalic(next)}
						aria-label="Toggle italic"
						variant="outline"
					>
						<ItalicIcon />
					</Toggle>
					<Toggle
						pressed={underline}
						onPressedChange={(next) => setUnderline(next)}
						aria-label="Toggle underline"
					>
						<UnderlineIcon />
					</Toggle>
				</div>

				<p className="text-sm text-muted-foreground">
					State: Bold {String(bold)}, Italic {String(italic)}, Underline{" "}
					{String(underline)}
				</p>
			</div>
		);
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
