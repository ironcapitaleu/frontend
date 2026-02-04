import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from './select';
import { Field, FieldGroup, FieldLabel } from '../field';

const ROLE_VALUES = ['admin', 'editor', 'viewer', 'billing'] as const;
type RoleValue = (typeof ROLE_VALUES)[number];

type RoleItem = {
    value: RoleValue;
    label: string;
    group: 'Team' | 'Access';
    disabled?: boolean;
};

const ROLE_ITEMS: RoleItem[] = [
    { value: 'admin', label: 'Admin', group: 'Access' },
    { value: 'editor', label: 'Editor', group: 'Team' },
    { value: 'viewer', label: 'Viewer', group: 'Team' },
    { value: 'billing', label: 'Billing', group: 'Access' },
];

type SelectStoryArgs = {
    label: string;
    placeholder: string;
    size: 'default' | 'sm';
    disabled: boolean;
    invalid: boolean;
    defaultValue: RoleValue | null;
};

/**
 * A `Select` is an interactive form control that allows users to choose one or more options from a predefined list.
 * Use a select whenever you want users to pick from a fixed set of choices without typing, such as choosing a country, a category, or a preference.
 * A `Select` is interactive, because users must actively open the list and make a selection.
 */
const meta: Meta<SelectStoryArgs> = {
    title: 'Components/Select',
    component: Select,
    tags: ['autodocs'],
    args: {
        label: 'Role',
        placeholder: 'Select a role',
        size: 'default',
        disabled: false,
        invalid: false,
        defaultValue: null,
    },
    argTypes: {
        label: { control: 'text' },
        placeholder: { control: 'text' },
        size: { control: 'inline-radio', options: ['default', 'sm'] },
        disabled: { control: 'boolean' },
        invalid: { control: 'boolean' },
        defaultValue: { control: 'select', options: [null, ...ROLE_VALUES] },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

function renderSelectPrompt(value: unknown, placeholder: string): React.ReactNode {
    if (value == null || value === '') {
        return placeholder;
    }

    if (typeof value === 'string') {
        return ROLE_ITEMS.find((item) => item.value === value)?.label ?? value;
    }

    if (typeof value === 'object' && value && 'label' in value) {
        const label = (value as { label?: unknown }).label;
        return typeof label === 'string' ? label : placeholder;
    }

    return String(value);
}

const renderSelect: Story['render'] = ({
    label,
    placeholder,
    size,
    disabled,
    invalid,
    defaultValue,
}) => {
    const id = React.useId();

    return (
        <Select items={ROLE_ITEMS} defaultValue={defaultValue}>
            <div className="flex max-w-sm flex-col gap-1">
                <label htmlFor={id} className="text-sm font-medium">
                    {label}
                </label>

                <SelectTrigger
                    id={id}
                    size={size}
                    disabled={disabled}
                    aria-invalid={invalid || undefined}
                    className="w-72 max-w-full"
                >
                    <SelectValue>
                        {(value: unknown) => renderSelectPrompt(value, placeholder)}
                    </SelectValue>
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        {ROLE_ITEMS.map((item) => (
                            <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </div>
        </Select>
    );
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for Select.
 */
export const Playground: Story = {
    render: renderSelect,
};

// ==========================================
// SIZE STORIES
// ==========================================

export const DefaultSize: Story = {
    render: renderSelect,
    args: {
        size: 'default',
        defaultValue: 'editor',
    },
    argTypes: {
        size: { control: { disable: true } },
    },
};

export const Small: Story = {
    render: renderSelect,
    args: {
        size: 'sm',
        defaultValue: 'editor',
    },
    argTypes: {
        size: { control: { disable: true } },
    },
};

// ==========================================
// STATE STORIES
// ==========================================

export const Disabled: Story = {
    render: renderSelect,
    args: {
        disabled: true,
        defaultValue: null,
    },
    argTypes: {
        disabled: { control: { disable: true } },
    },
};

export const Invalid: Story = {
    render: renderSelect,
    args: {
        invalid: true,
        defaultValue: null,
    },
    argTypes: {
        invalid: { control: { disable: true } },
    },
};

export const WithValue: Story = {
    render: renderSelect,
    args: {
        defaultValue: 'admin',
    },
    argTypes: {
        defaultValue: { control: { disable: true } },
    },
};

// ==========================================
// GROUPED STORIES
// ==========================================

export const Grouped: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => {
        const id = React.useId();

        const team = ROLE_ITEMS.filter((i) => i.group === 'Team');
        const access = ROLE_ITEMS.filter((i) => i.group === 'Access');

        return (
            <Select items={ROLE_ITEMS} defaultValue={null}>
                <div className="flex max-w-sm flex-col gap-1">
                    <label htmlFor={id} className="text-sm font-medium">
                        Role
                    </label>

                    <SelectTrigger id={id} className="w-72 max-w-full">
						<SelectValue>
							{(value: unknown) => renderSelectPrompt(value, 'Select a role')}
						</SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Team</SelectLabel>
                            {team.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>

                        <SelectSeparator />

                        <SelectGroup>
                            <SelectLabel>Access</SelectLabel>
                            {access.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </div>
            </Select>
        );
    },
};

export const WithDisabledItem: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => {
        const id = React.useId();

        const items: RoleItem[] = ROLE_ITEMS.map((item) =>
            item.value === 'billing' ? { ...item, disabled: true } : item
        );

        return (
            <Select items={items} defaultValue={null}>
                <div className="flex max-w-sm flex-col gap-1">
                    <label htmlFor={id} className="text-sm font-medium">
                        Role
                    </label>

                    <SelectTrigger id={id} className="w-72 max-w-full">
						<SelectValue>
							{(value: unknown) => renderSelectPrompt(value, 'Select a role')}
						</SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            {items.map((item) => (
                                <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </div>
            </Select>
        );
    },
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================

export const InField: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => (
        <div className="max-w-xl">
            <FieldGroup>
                <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Select items={ROLE_ITEMS} defaultValue={null}>
                        <SelectTrigger className="w-72 max-w-full">
                            <SelectValue>
                                {(value: unknown) => renderSelectPrompt(value, 'Select a role')}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {ROLE_ITEMS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
            </FieldGroup>
        </div>
    ),
};