import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import * as React from 'react';

import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from './field';
import { Input } from '../input';
import { Textarea } from '../textarea';

type FieldStoryArgs = ComponentProps<typeof Field> & {
	label: string;
	description: string;
	placeholder: string;
	required: boolean;
	disabled: boolean;
	invalid: boolean;
	errorMode: 'none' | 'single' | 'multiple' | 'custom';
};

/**
 * A `Field` is an interactive interface element where users enter, edit, or view data, typically as text, numbers, or other basic input types.
 * It pairs a `Label` (and optional description or error message) with an input/control and manages spacing and layout.
 * Use a `Field` whenever users need to provide or edit information directly, such as in forms, search bars, login forms, or settings.
 */
const meta: Meta<FieldStoryArgs> = {
	title: 'Components/Field',
	component: Field,
	tags: ['autodocs'],
	args: {
		label: 'Email',
		description: 'We will never share your email.',
		placeholder: 'name@example.com',
		required: false,
		disabled: false,
		invalid: false,
		errorMode: 'none',
		orientation: 'vertical',
	},
	argTypes: {
		label: { control: 'text' },
		description: { control: 'text' },
		placeholder: { control: 'text' },
		required: { control: 'boolean' },
		disabled: { control: 'boolean' },
		invalid: { control: 'boolean' },
		errorMode: {
			control: 'inline-radio',
			options: ['none', 'single', 'multiple', 'custom'],
		},
		orientation: {
			control: 'inline-radio',
			options: ['vertical', 'horizontal', 'responsive'],
			description: 'Layout orientation for label/content',
		},
		children: { control: { disable: true } },
		className: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderField: Story['render'] = ({
	label,
	description,
	placeholder,
	required,
	disabled,
	invalid,
	errorMode,
	...fieldProps
}) => {
	const id = React.useId();

	const errors =
		errorMode === 'multiple'
			? [{ message: 'Email is required.' }, { message: 'Must be a valid email address.' }]
			: errorMode === 'single'
				? [{ message: 'Please enter a valid email address.' }]
				: undefined;

	return (
		<div className="max-w-xl">
			<FieldGroup>
				<Field
					{...fieldProps}
					data-disabled={disabled ? true : undefined}
					data-invalid={invalid ? true : undefined}
				>
					<FieldLabel htmlFor={id}>
						{label}
						{required ? <span className="text-destructive">*</span> : null}
					</FieldLabel>
					<FieldContent>
						<Input
							id={id}
							type="email"
							placeholder={placeholder}
							disabled={disabled}
							required={required}
							aria-invalid={invalid || errorMode !== 'none'}
						/>
						{description ? <FieldDescription>{description}</FieldDescription> : null}
						{errorMode === 'custom' ? (
							<FieldError>Custom error message goes here.</FieldError>
						) : (
							<FieldError errors={errors} />
						)}
					</FieldContent>
				</Field>
			</FieldGroup>
		</div>
	);
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for Field.
 */
export const Playground: Story = {
	render: renderField,
};

// ==========================================
// ORIENTATION STORIES
// ==========================================

export const Vertical: Story = {
	render: renderField,
	args: {
		orientation: 'vertical',
	},
	argTypes: {
		orientation: { control: { disable: true } },
	},
};

export const Horizontal: Story = {
	render: renderField,
	args: {
		orientation: 'horizontal',
	},
	argTypes: {
		orientation: { control: { disable: true } },
	},
};

export const Responsive: Story = {
	render: renderField,
	args: {
		orientation: 'responsive',
	},
	argTypes: {
		orientation: { control: { disable: true } },
	},
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: renderField,
	args: {
		disabled: true,
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

export const InvalidSingleError: Story = {
	render: renderField,
	args: {
		invalid: true,
		errorMode: 'single',
	},
	argTypes: {
		invalid: { control: { disable: true } },
		errorMode: { control: { disable: true } },
	},
};

export const MultipleErrors: Story = {
	render: renderField,
	args: {
		invalid: true,
		errorMode: 'multiple',
	},
	argTypes: {
		invalid: { control: { disable: true } },
		errorMode: { control: { disable: true } },
	},
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

export const FieldGroupGrid: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const nameId = React.useId();
		const roleId = React.useId();

		return (
			<div className="max-w-xl">
				<FieldGroup>
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor={nameId}>Name</FieldLabel>
							<Input id={nameId} placeholder="Jane Doe" />
						</Field>
						<Field>
							<FieldLabel htmlFor={roleId}>Role</FieldLabel>
							<Input id={roleId} placeholder="Designer" />
						</Field>
					</div>
					<FieldSeparator>More</FieldSeparator>
					<Field>
						<FieldLabel>About</FieldLabel>
						<Textarea placeholder="A short description..." />
					</Field>
				</FieldGroup>
			</div>
		);
	},
};

// ==========================================
// FIELDSET STORIES
// ==========================================

export const FieldSetWithLegend: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const emailId = React.useId();
		const messageId = React.useId();

		return (
			<div className="max-w-xl">
				<FieldSet>
					<FieldLegend>Contact</FieldLegend>
					<FieldDescription>
						This section is grouped using a semantic <code>{'<fieldset>'}</code>.
					</FieldDescription>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={emailId}>Email</FieldLabel>
							<Input id={emailId} placeholder="name@example.com" />
						</Field>
						<Field>
							<FieldLabel htmlFor={messageId}>Message</FieldLabel>
							<Textarea id={messageId} placeholder="How can we help?" />
						</Field>
					</FieldGroup>
				</FieldSet>
			</div>
		);
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
