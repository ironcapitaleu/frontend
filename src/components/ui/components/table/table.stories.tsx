import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

type TableStoryArgs = {
  showCaption: boolean;
  caption: string;
  showFooter: boolean;
  showNotes: boolean;
  constrainedWidth: boolean;
  rowCount: number;
};

/**
 * A `Table` displays structured data in rows and columns.
 * Use it to help users scan, compare, and understand relationships between values.
 */
function InvoicesTableStory({
  showCaption,
  caption,
  showFooter,
  showNotes,
  constrainedWidth,
  rowCount,
}: TableStoryArgs) {
  const visibleInvoices = invoices.slice(0, rowCount);
  const colCount = showNotes ? 5 : 4;

  const table = (
    <Table>
      {showCaption ? <TableCaption>{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          {showNotes ? <TableHead className="w-[240px]">Notes</TableHead> : null}
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colCount} className="text-center text-muted-foreground">
              No invoices.
            </TableCell>
          </TableRow>
        ) : (
          visibleInvoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              {showNotes ? (
                <TableCell className="whitespace-nowrap">{invoice.note}</TableCell>
              ) : null}
              <TableCell className="text-right">{invoice.totalAmount}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      {showFooter ? (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={colCount - 1}>Total</TableCell>
            <TableCell className="text-right">$2,500.00</TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );

  return constrainedWidth ? <div className="max-w-md">{table}</div> : table;
}

const meta: Meta<typeof InvoicesTableStory> = {
  title: 'Components/Table',
  component: InvoicesTableStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    showCaption: true,
    caption: 'A list of your recent invoices.',
    showFooter: true,
    showNotes: false,
    constrainedWidth: false,
    rowCount: 7,
  },
  argTypes: {
    showCaption: { control: 'boolean' },
    caption: { control: 'text' },
    showFooter: { control: 'boolean' },
    showNotes: { control: 'boolean' },
    constrainedWidth: { control: 'boolean' },
    rowCount: { control: 'number', min: 0, max: 7, step: 1 },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type Invoice = {
  invoice: string;
  paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
  totalAmount: string;
  paymentMethod: string;
  note?: string;
};

const invoices: Invoice[] = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
    note: 'Monthly subscription',
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
    note: 'Awaiting confirmation',
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
    note: 'Net 30 terms',
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
    note: 'Annual renewal',
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
    note: 'Includes add-ons',
  },
  {
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer',
    note: 'Bank processing in progress',
  },
  {
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card',
    note: 'Payment failed — retry required',
  },
];

/**
 * Interactive playground for the Table component.
 */

// ==========================================
// PLAYGROUND
// ==========================================

export const Playground: Story = {
  render: (args) => <InvoicesTableStory {...args} />,
};

// ==========================================
// LAYOUT STORIES
// ==========================================

/**
 * Demonstrates horizontal scrolling behavior by constraining width.
 */
export const ConstrainedWidth: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <InvoicesTableStory {...args} />,
  args: {
    constrainedWidth: true,
    showNotes: true,
  },
};

// ==========================================
// CONTENT STORIES
// ==========================================

/**
 * Minimal table: header + body only.
 */
export const Minimal: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <InvoicesTableStory {...args} />,
  args: {
    showCaption: false,
    showFooter: false,
    showNotes: false,
    rowCount: 3,
  },
};

/**
 * Table with an additional notes column.
 */
export const WithNotesColumn: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <InvoicesTableStory {...args} />,
  args: {
    showNotes: true,
    rowCount: 5,
  },
};

/**
 * Empty state example (no rows).
 */
export const Empty: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: (args) => <InvoicesTableStory {...args} />,
  args: {
    rowCount: 0,
    showFooter: false,
    showNotes: false,
  },
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
