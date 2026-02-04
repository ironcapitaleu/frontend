import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from './alert-dialog';
import { Button, BUTTON_SIZES, BUTTON_VARIANTS } from '../button';

type AlertDialogStoryArgs = ComponentProps<typeof AlertDialog> & {
    triggerLabel: string;
    alertTitle: string;
    alertDescription: string;
    cancelLabel: string;
    actionLabel: string;

    dialogSize: 'default' | 'sm';

    triggerVariant: (typeof BUTTON_VARIANTS)[number];
    triggerSize: (typeof BUTTON_SIZES)[number];

    cancelVariant: (typeof BUTTON_VARIANTS)[number];
    cancelSize: (typeof BUTTON_SIZES)[number];

    actionVariant: (typeof BUTTON_VARIANTS)[number];
    actionSize: (typeof BUTTON_SIZES)[number];
};

/**
 * An `AlertDialog` interrupts the user to confirm a potentially destructive or irreversible action. 
 * Use when a decision is required before continuing (e.g. delete, leave page, reset).
 * It is inherently interactive element, as users must actively respond to the dialog before proceeding.
 */
const meta: Meta<AlertDialogStoryArgs> = {
    title: 'Components/AlertDialog',
    component: AlertDialog,
    tags: ['autodocs'],
    args: {
        // Story controls
        triggerLabel: 'Open Alert Dialog',
        alertTitle: 'Are you absolutely sure?',
        alertDescription:
            'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
        cancelLabel: 'Cancel',
        actionLabel: 'Continue',

        dialogSize: 'default',

        triggerVariant: 'default',
        triggerSize: 'default',

        cancelVariant: 'outline',
        cancelSize: 'default',

        actionVariant: 'default',
        actionSize: 'default',

        // Root props (you can toggle this in Controls too)
        defaultOpen: false,
    },
    argTypes: {
        triggerLabel: { control: 'text' },
        alertTitle: { control: 'text' },
        alertDescription: { control: 'text' },
        cancelLabel: { control: 'text' },
        actionLabel: { control: 'text' },

        dialogSize: { control: 'inline-radio', options: ['default', 'sm'] },

        triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
        triggerSize: { control: 'select', options: BUTTON_SIZES },

        cancelVariant: { control: 'select', options: BUTTON_VARIANTS },
        cancelSize: { control: 'select', options: BUTTON_SIZES },

        actionVariant: { control: 'select', options: BUTTON_VARIANTS },
        actionSize: { control: 'select', options: BUTTON_SIZES },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderDialog: Story['render'] = ({
    triggerLabel,
    alertTitle,
    alertDescription,
    cancelLabel,
    actionLabel,
    dialogSize,
    triggerVariant,
    triggerSize,
    cancelVariant,
    cancelSize,
    actionVariant,
    actionSize,
    ...rootProps
}) => (
    <AlertDialog {...rootProps}>
        <AlertDialogTrigger render={<Button variant={triggerVariant} size={triggerSize} />}>
            {triggerLabel}
        </AlertDialogTrigger>

        <AlertDialogContent size={dialogSize}>
            <AlertDialogHeader>
                <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
                <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
                <AlertDialogCancel variant={cancelVariant} size={cancelSize}>
                    {cancelLabel}
                </AlertDialogCancel>
                <AlertDialogAction variant={actionVariant} size={actionSize}>
                    {actionLabel}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);

export const Playground: Story = {
    render: renderDialog,
};

// ==========================================
// VARIANT STORIES
// ==========================================

export const Destructive: Story = {
    render: renderDialog,
    args: {
        triggerLabel: 'Delete Item',
        alertTitle: 'Delete this item?',
        alertDescription:
            'This action is irreversible. Please confirm you want to delete this item.',
        actionLabel: 'Delete',
        triggerVariant: 'destructive',
        actionVariant: 'destructive',
    },
};


// ==========================================
// SIZE STORIES
// ==========================================

export const Small: Story = {
    render: renderDialog,
    args: {
        triggerLabel: 'Open Small Dialog',
        alertTitle: 'Compact Dialog',
        alertDescription: 'This is a smaller version of the alert dialog for compact UIs.',
        actionLabel: 'OK',

        // Locked for this story:
        dialogSize: 'sm',
        triggerSize: 'sm',
    },
    argTypes: {
        dialogSize: { control: { disable: true } },
        triggerSize: { control: { disable: true } },
    },
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
