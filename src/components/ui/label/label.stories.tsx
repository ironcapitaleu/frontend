import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { Label } from './label';
import { Input } from '../input';

/**
 * A `Label` is a text element that describes or identifies a corresponding form field or input, helping users understand what data they need to provide.
 * Use a `Label` whenever you need to clarify the purpose of a form field, input, or interactive control to improve accessibility and usability.
 * A `Label` is generally non-interactive, but it can trigger focus on its associated input when clicked, which is a minimal form of interaction. It itself doesn’t accept user input.
 */
const meta: Meta<typeof Label> = {
    title: 'Components/Label',
    component: Label,
    tags: ['autodocs'],
    args: {
        children: 'Label',
    },
    argTypes: {
        children: { control: 'text' },
        className: { control: { disable: true } },
        htmlFor: { control: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderLabeledInput: Story['render'] = (args) => {
    const id = React.useId();

    return (
        <div className="max-w-sm space-y-2">
            <Label {...args} htmlFor={id} />
            <Input id={id} type="text" placeholder="Enter text…" />
            <p className="text-muted-foreground text-xs">
                Click or tab into the input to see focus styles.
            </p>
        </div>
    );
};

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for Label.
 */
export const Playground: Story = {
    render: renderLabeledInput,
    args: {
        children: 'Email',
    },
};

// ==========================================
// STATE STORIES
// ==========================================

/**
 * Default label associated to an input via htmlFor/id.
 */
export const Default: Story = {
    render: renderLabeledInput,
    args: {
        children: 'Email',
    },
    argTypes: {
        children: { control: { disable: true } },
    },
};

/**
 * Demonstrates the `group-data-[disabled=true]` styles on Label.
 * This is useful when a parent "field" is disabled.
 */
export const GroupDisabled: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => {
        const id = React.useId();

        return (
            <div className="group max-w-sm space-y-2" data-disabled="true">
                <Label htmlFor={id}>Email</Label>
                <Input id={id} type="email" placeholder="name@example.com" disabled />
                <p className="text-muted-foreground text-xs">
                    Label is dimmed via parent <code>data-disabled</code>.
                </p>
            </div>
        );
    },
};

/**
 * Demonstrates the `peer-disabled:*` styles on Label.
 * (This requires the label to be after the peer element.)
 */
export const PeerDisabled: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => {
        const id = React.useId();

        return (
            <div className="max-w-sm space-y-2">
                <Input
                    id={id}
                    className="peer"
                    type="email"
                    placeholder="name@example.com"
                    disabled
                />
                <Label htmlFor={id}>Email</Label>
                <p className="text-muted-foreground text-xs">
                    Label reacts to the disabled peer input.
                </p>
            </div>
        );
    },
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

/**
 * Label can wrap a control to increase the click target.
 */
export const WrappingCheckbox: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => (
        <div className="max-w-sm space-y-2">
            <Label className="gap-2">
                <input type="checkbox" className="size-4" />
                Subscribe to updates
            </Label>
            <p className="text-muted-foreground text-xs">
                Clicking the label toggles the checkbox.
            </p>
        </div>
    ),
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================

/**
 * Example of a "required" indicator.
 */
export const RequiredIndicator: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => {
        const id = React.useId();

        return (
            <div className="max-w-sm space-y-2">
                <Label htmlFor={id}>
                    Email <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input id={id} type="email" placeholder="name@example.com" required />
            </div>
        );
    },
};
