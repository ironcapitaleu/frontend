import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '../field';
import { Textarea } from './textarea';

/**
 * A `Textarea` is an interactive form control that allows users to enter or edit multi-line text.
 * Use a `Textarea` whenever users need to provide longer or freeform text input, such as comments, messages, descriptions, or notes.
 * Like other text inputs, it can be disabled, required, or marked invalid.
 * A `Textarea` is interactive, because users actively type, edit, and scroll content within them.
 */
const meta: Meta<typeof Textarea> = {
	title: 'Components/Textarea',
	component: Textarea,
	tags: ['autodocs'],
	args: {
		placeholder: 'Write something…',
		disabled: false,
		required: false,
		'aria-invalid': false,
		rows: 4,
	},
	argTypes: {
		placeholder: { control: 'text' },
		disabled: { control: 'boolean' },
		required: { control: 'boolean' },
		'aria-invalid': { control: 'boolean' },
		rows: { control: { type: 'number', min: 1, max: 12, step: 1 } },
		className: { control: { disable: true } },
		value: { control: { disable: true } },
		defaultValue: { control: { disable: true } },
		onChange: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof Textarea>;

const renderTextarea: Story['render'] = (args) => {
	const id = React.useId();

	return (
		<div className="max-w-sm space-y-2">
			<label htmlFor={id} className="text-sm font-medium">
				Message{args.required ? <span className="text-destructive">*</span> : null}
			</label>
			<Textarea id={id} {...args} />
			<p className="text-muted-foreground text-xs">
				Focus to see ring + invalid state. {args.required ? 'Required.' : 'Optional.'}
			</p>
		</div>
	);
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for Textarea.
 */
export const Playground: Story = {
	render: renderTextarea,
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: renderTextarea,
	args: {
		disabled: true,
		placeholder: 'Disabled',
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

export const Invalid: Story = {
	render: renderTextarea,
	args: {
		'aria-invalid': true,
		placeholder: 'Invalid value',
	},
	argTypes: {
		'aria-invalid': { control: { disable: true } },
	},
};

export const Required: Story = {
	render: renderTextarea,
	args: {
		required: true,
		placeholder: 'Required',
	},
	argTypes: {
		required: { control: { disable: true } },
	},
};

// ==========================================
// SIZE STORIES
// ==========================================

export const FewerRows: Story = {
	render: renderTextarea,
	args: {
		rows: 2,
		placeholder: 'Short message…',
	},
	argTypes: {
		rows: { control: { disable: true } },
	},
};

export const MoreRows: Story = {
	render: renderTextarea,
	args: {
		rows: 8,
		placeholder: 'Longer message…',
	},
	argTypes: {
		rows: { control: { disable: true } },
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================

export const InField: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const id = React.useId();
		return (
			<div className="max-w-xl">
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={id}>Message</FieldLabel>
						<FieldContent>
							<Textarea id={id} placeholder="How can we help?" rows={5} />
							<FieldDescription>
								Include as much context as possible.
							</FieldDescription>
						</FieldContent>
					</Field>
				</FieldGroup>
			</div>
		);
	},
};

