import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { MailIcon, SearchIcon, XIcon, AlertCircleIcon } from 'lucide-react';

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from './input-group';

const ADDON_ALIGNMENTS = [
	'inline-start',
	'inline-end',
	'block-start',
	'block-end',
] as const;

const INPUT_GROUP_BUTTON_SIZES = ['xs', 'sm', 'icon-xs', 'icon-sm'] as const;

type InputGroupStoryArgs = {
	label: string;
	placeholder: string;
	control: 'input' | 'textarea';
	addonAlign: (typeof ADDON_ALIGNMENTS)[number];
	showLeadingAddon: boolean;
	showTrailingButton: boolean;
	buttonSize: (typeof INPUT_GROUP_BUTTON_SIZES)[number];
	disabled: boolean;
	invalid: boolean;
	withKbdHint: boolean;
};

/**
 * An `InputGroup` is a wrapper that combines one or more input fields with associated elements like buttons, icons, or labels, creating a single cohesive control.
 * Use an `InputGroup` when you want to enhance a field with extra context or actions, such as a search field with a button, a URL field with a domain prefix, or a currency input with a symbol.
 * `InputGroup`s are interactive, because their primary purpose is to let the user interact with the contained inputs or controls. The group itself is a container, but the components inside are interactive.
 */
const meta: Meta<InputGroupStoryArgs> = {
	title: 'Components/InputGroup',
	tags: ['autodocs'],
	args: {
		label: 'Email',
		placeholder: 'name@example.com',
		control: 'input',
		addonAlign: 'inline-start',
		showLeadingAddon: true,
		showTrailingButton: true,
		buttonSize: 'icon-xs',
		disabled: false,
		invalid: false,
		withKbdHint: false,
	},
	argTypes: {
		label: { control: 'text' },
		placeholder: { control: 'text' },
		control: { control: 'inline-radio', options: ['input', 'textarea'] },
		addonAlign: { control: 'inline-radio', options: ADDON_ALIGNMENTS },
		showLeadingAddon: { control: 'boolean' },
		showTrailingButton: { control: 'boolean' },
		buttonSize: { control: 'select', options: INPUT_GROUP_BUTTON_SIZES },
		disabled: { control: 'boolean' },
		invalid: { control: 'boolean' },
		withKbdHint: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderInputGroup: Story['render'] = ({
	label,
	placeholder,
	control,
	addonAlign,
	showLeadingAddon,
	showTrailingButton,
	buttonSize,
	disabled,
	invalid,
	withKbdHint,
}) => {
	const id = React.useId();

	return (
		<div className="max-w-xl space-y-2">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			<InputGroup data-disabled={disabled ? true : undefined}>
				{showLeadingAddon ? (
					<InputGroupAddon align={addonAlign}>
						<InputGroupText>
							{invalid ? <AlertCircleIcon /> : <MailIcon />}
							{addonAlign.startsWith('block') ? 'Contact' : null}
							{withKbdHint ? <kbd>⌘K</kbd> : null}
						</InputGroupText>
					</InputGroupAddon>
				) : null}

				{control === 'textarea' ? (
					<InputGroupTextarea
						id={id}
						disabled={disabled}
						aria-invalid={invalid}
						placeholder={placeholder}
						rows={3}
					/>
				) : (
					<InputGroupInput
						id={id}
						disabled={disabled}
						aria-invalid={invalid}
						placeholder={placeholder}
					/>
				)}

				{showTrailingButton ? (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							size={buttonSize}
							disabled={disabled}
							aria-label="Clear"
						>
							<XIcon />
						</InputGroupButton>
					</InputGroupAddon>
				) : null}
			</InputGroup>
			<p className="text-muted-foreground text-xs">
				Try focusing the control to see the group ring.
			</p>
		</div>
	);
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for InputGroup.
 */
export const Playground: Story = {
	render: renderInputGroup,
};

// ==========================================
// ALIGNMENT STORIES
// ==========================================

export const InlineStartAddon: Story = {
	render: renderInputGroup,
	args: {
		addonAlign: 'inline-start',
		control: 'input',
		label: 'Search',
		placeholder: 'Search…',
	},
	argTypes: {
		addonAlign: { control: { disable: true } },
		control: { control: { disable: true } },
	},
};

export const InlineEndAddon: Story = {
	render: renderInputGroup,
	args: {
		addonAlign: 'inline-end',
		control: 'input',
		label: 'Search',
		placeholder: 'Search…',
	},
	argTypes: {
		addonAlign: { control: { disable: true } },
		control: { control: { disable: true } },
	},
};

export const BlockStartAddon: Story = {
	render: renderInputGroup,
	args: {
		addonAlign: 'block-start',
		control: 'textarea',
		label: 'Message',
		placeholder: 'Write a message…',
		showTrailingButton: false,
	},
	argTypes: {
		addonAlign: { control: { disable: true } },
		control: { control: { disable: true } },
		showTrailingButton: { control: { disable: true } },
	},
};

export const BlockEndAddon: Story = {
	render: renderInputGroup,
	args: {
		addonAlign: 'block-end',
		control: 'textarea',
		label: 'Message',
		placeholder: 'Write a message…',
		showTrailingButton: false,
	},
	argTypes: {
		addonAlign: { control: { disable: true } },
		control: { control: { disable: true } },
		showTrailingButton: { control: { disable: true } },
	},
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: renderInputGroup,
	args: {
		disabled: true,
		label: 'Email',
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

export const Invalid: Story = {
	render: renderInputGroup,
	args: {
		invalid: true,
		label: 'Email',
		placeholder: 'name@example.com',
	},
	argTypes: {
		invalid: { control: { disable: true } },
	},
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

export const SearchWithShortcut: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const id = React.useId();
		return (
			<div className="max-w-xl space-y-2">
				<label htmlFor={id} className="text-sm font-medium">
					Search
				</label>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<SearchIcon />
							<span className="sr-only">Search icon</span>
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput id={id} placeholder="Search…" />
					<InputGroupAddon align="inline-end">
						<InputGroupText>
							<kbd>⌘K</kbd>
						</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
			</div>
		);
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================

