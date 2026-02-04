import type { Meta, StoryObj } from '@storybook/react-vite';

import { Separator } from './separator';

/**
 * A `Separator` is a visual element that divides or groups content within a UI, typically using a line, space, or subtle visual cue.
 * Use a `Separator` whenever you want to organize content, create visual hierarchy, or distinguish sections without adding functional controls. Examples: dividing menu items, form sections, or card content.
 * A `Separator` is non-interactive, as it serves only a visual or structural purpose and doesn’t accept user input or trigger actions.
 * 
 */
const meta: Meta<typeof Separator> = {
	title: 'Components/Separator',
	component: Separator,
	tags: ['autodocs'],
	args: {
		orientation: 'horizontal',
	},
	argTypes: {
		orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
		className: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof Separator>;

const renderSeparator: Story['render'] = (args) => {
	if (args.orientation === 'vertical') {
		return (
			<div className="max-w-md">
				<div className="bg-muted border-border flex h-20 items-stretch rounded-lg border p-4">
					<div className="flex flex-1 items-center justify-center text-sm font-medium">
						Section A
					</div>
					<Separator {...args} className="mx-4" />
					<div className="flex flex-1 items-center justify-center text-sm font-medium">
						Section B
					</div>
				</div>
				<p className="text-muted-foreground mt-2 text-xs">
					Vertical separator divides side-by-side content.
				</p>
			</div>
		);
	}

	return (
		<div className="max-w-md">
			<div className="bg-muted border-border space-y-3 rounded-lg border p-4">
				<div className="text-sm font-medium">Section A</div>
				<Separator {...args} />
				<div className="text-sm font-medium">Section B</div>
			</div>
			<p className="text-muted-foreground mt-2 text-xs">
				Horizontal separator divides stacked content.
			</p>
		</div>
	);
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for Separator.
 */
export const Playground: Story = {
	render: renderSeparator,
};

// ==========================================
// ORIENTATION STORIES
// ==========================================

export const Horizontal: Story = {
	render: renderSeparator,
	args: {
		orientation: 'horizontal',
	},
	argTypes: {
		orientation: { control: { disable: true } },
	},
};

export const Vertical: Story = {
	render: renderSeparator,
	args: {
		orientation: 'vertical',
	},
	argTypes: {
		orientation: { control: { disable: true } },
	},
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

export const InToolbar: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div>
			<div className="bg-muted border-border inline-flex h-10 w-auto items-center gap-1 rounded-lg border px-2">
				<button className="hover:bg-accent rounded px-2 py-1 text-sm transition-colors">
					Cut
				</button>
				<button className="hover:bg-accent rounded px-2 py-1 text-sm transition-colors">
					Copy
				</button>
					<Separator orientation="vertical" className="mx-2 h-5 self-center" />
				<button className="hover:bg-accent rounded px-2 py-1 text-sm transition-colors">
					Paste
				</button>
			</div>
			<p className="text-muted-foreground mt-2 text-xs">
				The vertical separator divides button groups in this toolbar.
			</p>
		</div>
	),
};

export const BetweenParagraphs: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="max-w-md">
			<div className="bg-muted border-border space-y-4 rounded-lg border p-4">
				<div>
					<h3 className="text-sm font-semibold">About this project</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						This is the first section with introductory content.
					</p>
				</div>
				<Separator />
				<div>
					<h3 className="text-sm font-semibold">Getting started</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						This is the second section with additional details.
					</p>
				</div>
			</div>
			<p className="text-muted-foreground mt-2 text-xs">
				Horizontal separator between content blocks.
			</p>
		</div>
	),
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
