import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarStoryArgs = {
	size: AvatarSize;
	src?: string;
	alt: string;
	fallback: string;
} & Omit<ComponentProps<typeof Avatar>, "children">;

const AVATAR_SIZES = [
	"sm",
	"md",
	"lg",
	"xl",
] as const satisfies readonly AvatarSize[];

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
	sm: { container: "size-8", text: "text-xs" },
	md: { container: "size-10", text: "text-sm" },
	lg: { container: "size-14", text: "text-lg" },
	xl: { container: "size-20", text: "text-2xl" },
};

function AvatarStory({
	size,
	src,
	alt,
	fallback,
	className,
	...props
}: AvatarStoryArgs) {
	const { container, text } = sizeClasses[size];
	return (
		<Avatar className={`${container} ${className ?? ""}`} {...props}>
			{src ? <AvatarImage src={src} alt={alt} className="grayscale" /> : null}
			<AvatarFallback className={text}>{fallback}</AvatarFallback>
		</Avatar>
	);
}

/**
 * An `Avatar` is a visual component that represents a person, account, or entity, typically using an image, initials, or an icon.
 * Use an `Avatar` when you want to identify users or entities at a glance, such as in profiles, comments, messages, or user lists. Use `AvatarImage` for the image and `AvatarFallback` for initials.
 * An `Avatar` is not inherently interactive, but it can become interactive when used as a click target for actions like opening a profile or menu.
 */
const meta: Meta<AvatarStoryArgs> = {
	title: "Components/Avatar",
	component: AvatarStory,
	tags: ["autodocs"],
	args: {
		size: "md",
		src: "https://picsum.photos/seed/DDog97/128",
		alt: "DDog97 avatar",
		fallback: "D",
	},
	argTypes: {
		size: { control: "select", options: AVATAR_SIZES },
		src: { control: "text" },
		alt: { control: "text" },
		fallback: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for the Avatar component.
 */
export const Playground: Story = {
	render: (args) => <AvatarStory {...args} />,
};

// ==========================================
// SIZES
// ==========================================

/**
 * Common sizes for avatars.
 */
export const Sizes: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="flex items-center gap-6">
			<AvatarStory
				size="sm"
				src="https://picsum.photos/seed/DDog97/128"
				alt="DDog97 avatar"
				fallback="D"
			/>
			<AvatarStory
				size="md"
				src="https://picsum.photos/seed/Elecdashi/128"
				alt="Elecdashi avatar"
				fallback="E"
			/>
			<AvatarStory
				size="lg"
				src="https://picsum.photos/seed/deca09/128"
				alt="deca09 avatar"
				fallback="D"
			/>
			<AvatarStory
				size="xl"
				src="https://picsum.photos/seed/UserXL/128"
				alt="Extra Large avatar"
				fallback="XL"
			/>
		</div>
	),
};

// ==========================================
// FALLBACK
// ==========================================

/**
 * Fallback-only avatar (e.g. when no image is available).
 */
export const FallbackOnly: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="flex items-center gap-6">
			<AvatarStory size="sm" alt="DDog97" fallback="SM" />
			<AvatarStory size="md" alt="Elecdashi" fallback="MD" />
			<AvatarStory size="lg" alt="deca09" fallback="LG" />
			<AvatarStory size="xl" alt="deca09" fallback="XL" />
		</div>
	),
};

// ==========================================
// SHAPES
// ==========================================

/**
 * Customized shapes using utility classes.
 */
export const Shapes: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="flex items-center gap-6">
			{/* Rounded Full (Default) */}
			<AvatarStory size="lg" fallback="RF" alt="RF" />

			{/* Rounded Small */}
			<AvatarStory size="lg" fallback="RS" alt="RS" className="rounded-sm" />

			{/* Rounded Medium */}
			<AvatarStory size="lg" fallback="RM" alt="RM" className="rounded-md" />

			{/* Rounded Large */}
			<AvatarStory size="lg" fallback="RL" alt="RL" className="rounded-lg" />

			{/* Rounded Square */}
			<AvatarStory size="lg" fallback="SQ" alt="SQ" className="rounded-none" />
		</div>
	),
};

// ==========================================
// GROUP
// ==========================================

/**
 * Grouped avatars (common for teams/collaboration UI).
 */
export const Group: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="flex items-center -space-x-2 *:ring-2 *:ring-background">
			<AvatarStory
				size="md"
				src="https://picsum.photos/seed/DDog97/128"
				alt="DDog97"
				fallback="D"
			/>
			<AvatarStory
				size="md"
				src="https://picsum.photos/seed/Elecdashi/128"
				alt="Elecdashi"
				fallback="E"
			/>
			<AvatarStory
				size="md"
				src="https://picsum.photos/seed/deca09/128"
				alt="deca09"
				fallback="D"
			/>
			<Avatar className={sizeClasses.md.container}>
				<AvatarFallback className={sizeClasses.md.text}>+3</AvatarFallback>
			</Avatar>
		</div>
	),
};

// ==========================================
// INTERACTIVE
// ==========================================

/**
 * Avatars can be made interactive by adding event handlers and cursor styles,
 * or by wrapping them in interactive elements like buttons.
 */
export const Interactive: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="flex items-center gap-6">
			{/* Clickable Avatar (Direct) */}
			<AvatarStory
				size="md"
				fallback="CL"
				alt="Clickable avatar"
				className="cursor-pointer hover:opacity-80 transition-opacity"
				onClick={() => alert("Avatar clicked!")}
				title="Click me"
			/>

			{/* Wrapped in Button (Better Accessibility) */}
			<button
				type="button"
				className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				onClick={() => alert("Button wrapper clicked!")}
				title="Click wrapper"
			>
				<AvatarStory size="md" fallback="BT" alt="Button wrapped avatar" />
			</button>
		</div>
	),
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
