import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Input } from "./input";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "../field";

const INPUT_TYPES = [
	"text",
	"email",
	"password",
	"search",
	"number",
	"file",
] as const;

/**
 * An `Input` is a basic form element that allows users to enter or edit text or data, such as text, numbers, passwords, or email.
 * Use an `Input` whenever users need to provide specific data or text directly, like in login forms, search boxes, or data entry fields.
 * `Input`s are always interactive, because their main purpose is to accept user input. Even if they’re disabled or read-only, they are fundamentally designed for interaction.
 */
const meta: Meta<typeof Input> = {
	title: "Components/Input",
	component: Input,
	tags: ["autodocs"],
	args: {
		type: "text",
		placeholder: "Enter text…",
		disabled: false,
		required: false,
		"aria-invalid": false,
	},
	argTypes: {
		type: { control: "select", options: INPUT_TYPES },
		placeholder: { control: "text" },
		disabled: { control: "boolean" },
		required: { control: "boolean" },
		"aria-invalid": { control: "boolean" },
		className: { control: { disable: true } },
		value: { control: { disable: true } },
		defaultValue: { control: { disable: true } },
		onChange: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof Input>;

const renderInput: Story["render"] = (args) => {
	const id = React.useId();

	return (
		<div className="max-w-sm space-y-2">
			<label htmlFor={id} className="text-sm font-medium">
				Input
			</label>
			<Input id={id} {...args} />
			<p className="text-muted-foreground text-xs">
				Focus to see ring + invalid state.
			</p>
		</div>
	);
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for Input.
 */
export const Playground: Story = {
	render: renderInput,
};

// ==========================================
// TYPE STORIES
// ==========================================

export const Text: Story = {
	render: renderInput,
	args: {
		type: "text",
		placeholder: "Jane Doe",
	},
	argTypes: {
		type: { control: { disable: true } },
	},
};

export const Email: Story = {
	render: renderInput,
	args: {
		type: "email",
		placeholder: "name@example.com",
	},
	argTypes: {
		type: { control: { disable: true } },
	},
};

export const Password: Story = {
	render: renderInput,
	args: {
		type: "password",
		placeholder: "••••••••",
	},
	argTypes: {
		type: { control: { disable: true } },
	},
};

export const Search: Story = {
	render: renderInput,
	args: {
		type: "search",
		placeholder: "Search…",
	},
	argTypes: {
		type: { control: { disable: true } },
	},
};

export const Number: Story = {
	render: renderInput,
	args: {
		type: "number",
		placeholder: "42",
	},
	argTypes: {
		type: { control: { disable: true } },
	},
};

export const File: Story = {
	render: (args) => {
		const id = React.useId();
		return (
			<div className="max-w-sm space-y-2">
				<label htmlFor={id} className="text-sm font-medium">
					Upload
				</label>
				<Input id={id} {...args} />
			</div>
		);
	},
	args: {
		type: "file",
		placeholder: undefined,
	},
	argTypes: {
		type: { control: { disable: true } },
		placeholder: { control: { disable: true } },
	},
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
	render: renderInput,
	args: {
		disabled: true,
		placeholder: "Disabled",
	},
	argTypes: {
		disabled: { control: { disable: true } },
	},
};

export const Invalid: Story = {
	render: renderInput,
	args: {
		"aria-invalid": true,
		placeholder: "Invalid value",
	},
	argTypes: {
		"aria-invalid": { control: { disable: true } },
	},
};

export const Required: Story = {
	render: renderInput,
	args: {
		required: true,
		placeholder: "Required",
	},
	argTypes: {
		required: { control: { disable: true } },
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
						<FieldLabel htmlFor={id}>Email</FieldLabel>
						<FieldContent>
							<Input id={id} type="email" placeholder="name@example.com" />
							<FieldDescription>
								We will never share your email.
							</FieldDescription>
						</FieldContent>
					</Field>
				</FieldGroup>
			</div>
		);
	},
};
