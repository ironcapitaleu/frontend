import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

type AccordionStoryArgs = {
  multiple: boolean;
  orientation: 'vertical' | 'horizontal';
  defaultOpen: 'none' | 'first' | 'second' | 'all';
  disabled: boolean;
  disableSecondItem: boolean;
  keepMounted: boolean;
};


function AccordionStory({
  multiple,
  orientation,
  defaultOpen,
  disabled,
  disableSecondItem,
  keepMounted,
}: AccordionStoryArgs) {
  const items = [
    {
      value: 'account',
      title: 'Account',
      body: 'Manage profile details like name, email, and connected accounts.',
    },
    {
      value: 'billing',
      title: 'Billing',
      body: 'View invoices, update payment method, and manage your subscription.',
    },
    {
      value: 'security',
      title: 'Security',
      body: 'Update password, configure 2FA, and view recent sign-in activity.',
    },
  ] as const;

  const defaultValue = (() => {
    switch (defaultOpen) {
      case 'first':
        return ['account'];
      case 'second':
        return ['billing'];
      case 'all':
        return items.map((item) => item.value);
      case 'none':
      default:
        return [];
    }
  })();

  return (
    <div className="max-w-xl">
      <Accordion
        multiple={multiple}
        orientation={orientation}
        defaultValue={defaultValue}
        disabled={disabled}
        keepMounted={keepMounted}
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.value}
            value={item.value}
            disabled={disableSecondItem && index === 1}
          >
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>
              <p>{item.body}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/**
 * An `Accordion` is a component that shows and hides sections of related content, allowing users to expand or collapse panels as needed.
 * Use an `Accordion` component when you want to save vertical space or reduce cognitive load by revealing content progressively, such as FAQs, settings groups, or detailed information sections.
 * An `Accordion` is interactive, since users actively expand and collapse sections to view content.
 */
const meta: Meta<typeof AccordionStory> = {
  title: 'Components/Accordion',
  component: AccordionStory,
  tags: ['autodocs'],
  args: {
    multiple: false,
    orientation: 'vertical',
    defaultOpen: 'none',
    disabled: false,
    disableSecondItem: false,
    keepMounted: false,
  },
  argTypes: {
    multiple: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    defaultOpen: { control: 'inline-radio', options: ['none', 'first', 'second', 'all'] },
    disabled: { control: 'boolean' },
    disableSecondItem: { control: 'boolean' },
    keepMounted: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for the Accordion component.
 * Use the controls to explore single vs multiple, default open state, and disabled behavior.
 */

// ==========================================
// PLAYGROUND
// ==========================================

export const Playground: Story = {
  render: (args) => <AccordionStory {...args} />,
};

// ==========================================
// MODE STORIES
// ==========================================

/**
 * Single open item (default behavior).
 */
export const Default: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <AccordionStory {...args} />,
  args: {
    multiple: false,
    defaultOpen: 'first',
  },
};

/**
 * Multiple items can be open at the same time.
 */
export const Multiple: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <AccordionStory {...args} />,
  args: {
    multiple: true,
    defaultOpen: 'all',
  },
};

// ==========================================
// STATE STORIES
// ==========================================

/**
 * Disables only the second item.
 */
export const DisabledItem: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <AccordionStory {...args} />,
  args: {
    disableSecondItem: true,
    defaultOpen: 'none',
  },
};

/**
 * Disables the entire accordion.
 */
export const Disabled: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <AccordionStory {...args} />,
  args: {
    disabled: true,
    defaultOpen: 'none',
  },
};

// ==========================================
// ORIENTATION STORIES
// ==========================================

/**
 * Orientation changes keyboard navigation behavior.
 */
export const Horizontal: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <AccordionStory {...args} />,
  args: {
    orientation: 'horizontal',
    defaultOpen: 'none',
  },
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
