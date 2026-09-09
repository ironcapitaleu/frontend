import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from ".";

/**
 * A `Skeleton` is a pulsing placeholder that reserves space for content still
 * loading, so the layout stays stable instead of collapsing or jumping.
 *
 * The primitive is a single neutral shape. Width, height, and radius come from
 * `className`. The stories below show how a page composes it into text lines, an
 * avatar, and a card.
 */
const meta: Meta<typeof Skeleton> = {
	title: "Components/Skeleton",
	component: Skeleton,
	tags: ["autodocs"],
	args: {
		className: "h-4 w-48",
	},
	argTypes: {
		className: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground. Set `className` to size and shape the placeholder.
 */
export const Playground: Story = {};

/**
 * Stacked lines stand in for a paragraph, with a shorter final line.
 */
export const TextLines: Story = {
	render: () => (
		<div className="flex w-64 flex-col gap-2">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/5" />
		</div>
	),
};

/**
 * A circle stands in for an avatar while the image loads.
 */
export const Avatar: Story = {
	render: () => <Skeleton className="size-12 rounded-full" />,
};

/**
 * Placeholders combine into a card: an avatar beside two lines of text.
 */
export const Card: Story = {
	render: () => (
		<div className="flex w-72 items-center gap-4 rounded-xl border border-border p-4">
			<Skeleton className="size-12 shrink-0 rounded-full" />
			<div className="flex flex-1 flex-col gap-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
			</div>
		</div>
	),
};
