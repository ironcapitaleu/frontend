import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { VariantShowcase } from '../../../../.storybook/utils/showcaseDecorators';
import { Badge } from './badge';

const BADGE_VARIANTS = [
	'default',
	'secondary',
	'destructive',
	'outline',
	'ghost',
	'link',
] as const;

type BadgeStoryArgs = ComponentProps<typeof Badge> & {
	label: string;
};

/**
 * A `Badge` is a compact, mostly non-interactive label for status/metadata (e.g. “New”, “Beta”, “Pro”). 
 * Use `Button` for actions/click targets. This `Badge` renders a <span> by default.
 */
const meta: Meta<BadgeStoryArgs> = {
	title: 'Components/Badge',
	component: Badge,
	tags: ['autodocs'],
	args: {
		label: 'Badge',
		variant: 'default',
	},
	argTypes: {
		label: { control: 'text' },
		variant: { control: 'select', options: BADGE_VARIANTS },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderBadge: Story['render'] = ({ label, ...args }) => (
	<Badge {...args}>{label}</Badge>
);

/**
 * Interactive playground for the Badge component.
 */
export const Playground: Story = {
	render: renderBadge,
};

// ==========================================
// VARIANT STORIES
// ==========================================

/**
 * Shows all badge variants in one view.
 */
export const Variants: Story = {
	argTypes: {
		variant: { control: { disable: true } },
	},
	render: () => (
		<VariantShowcase
			Component={Badge as unknown as React.ComponentType<any>}
			variants={[...BADGE_VARIANTS]}
			variantKey="variant"
			baseProps={{ children: 'Badge' }}
		/>
	),
};

export const Default: Story = {
	args: { variant: 'default', label: 'Default' },
	argTypes: { variant: { control: { disable: true } } },
	render: renderBadge,
};

export const Secondary: Story = {
	args: { variant: 'secondary', label: 'Secondary' },
	argTypes: { variant: { control: { disable: true } } },
	render: renderBadge,
};

export const Destructive: Story = {
	args: { variant: 'destructive', label: 'Destructive' },
	argTypes: { variant: { control: { disable: true } } },
	render: renderBadge,
};

export const Outline: Story = {
	args: { variant: 'outline', label: 'Outline' },
	argTypes: { variant: { control: { disable: true } } },
	render: renderBadge,
};

export const Ghost: Story = {
	args: { variant: 'ghost', label: 'Ghost' },
	argTypes: { variant: { control: { disable: true } } },
	render: renderBadge,
};

export const Link: Story = {
	args: { variant: 'link', label: 'Link' },
	argTypes: { variant: { control: { disable: true } } },
	render: renderBadge,
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
