import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Area as RechartsArea,
  AreaChart,
  Bar as RechartsBar,
  BarChart,
  CartesianGrid,
  Line as RechartsLine,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

type ChartStoryArgs = {
  chartType: 'area' | 'bar' | 'line';
  showGrid: boolean;
  showYAxis: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  tooltipIndicator: 'dot' | 'line' | 'dashed';
};

const chartData = [
  { month: 'Jan', revenue: 1860, orders: 120 },
  { month: 'Feb', revenue: 3050, orders: 180 },
  { month: 'Mar', revenue: 2370, orders: 160 },
  { month: 'Apr', revenue: 730, orders: 90 },
  { month: 'May', revenue: 2090, orders: 140 },
  { month: 'Jun', revenue: 2140, orders: 150 },
];

const config: ChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--color-chart-1)',
  },
  orders: {
    label: 'Orders',
    color: 'var(--color-chart-2)',
  },
};


function ChartStory({
  chartType,
  showGrid,
  showYAxis,
  showLegend,
  showTooltip,
  tooltipIndicator,
}: ChartStoryArgs) {
  const common = {
    grid: showGrid ? <CartesianGrid vertical={false} /> : null,
    xAxis: <XAxis dataKey="month" tickLine={false} axisLine={false} />,
    yAxis: showYAxis ? <YAxis tickLine={false} axisLine={false} /> : null,
    tooltip: showTooltip ? (
      <ChartTooltip content={<ChartTooltipContent indicator={tooltipIndicator} />} />
    ) : null,
    legend: showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null,
  };

  const chart =
    chartType === 'area' ? (
      <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
        {common.grid}
        {common.xAxis}
        {common.yAxis}
        {common.tooltip}
        {common.legend}

        <RechartsArea
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          fill="var(--color-revenue)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <RechartsArea
          type="monotone"
          dataKey="orders"
          stroke="var(--color-orders)"
          fill="var(--color-orders)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    ) : chartType === 'bar' ? (
      <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
        {common.grid}
        {common.xAxis}
        {common.yAxis}
        {common.tooltip}
        {common.legend}

        <RechartsBar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <RechartsBar dataKey="orders" fill="var(--color-orders)" radius={4} />
      </BarChart>
    ) : (
      <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
        {common.grid}
        {common.xAxis}
        {common.yAxis}
        {common.tooltip}
        {common.legend}

        <RechartsLine
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
        />
        <RechartsLine
          type="monotone"
          dataKey="orders"
          stroke="var(--color-orders)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    );

  return (
    <div className="max-w-3xl">
      <ChartContainer config={config}>{chart}</ChartContainer>
    </div>
  );
}

/**
 * A generic `Chart` component.
 * A `Chart` is a visual component that represents data graphically to help users quickly understand patterns, trends, and comparisons.
 * Use a `Chart` when you want to communicate insights or relationships in data more effectively than raw numbers, such as trends over time, distributions, or comparisons between values.
 * A `Chart` is not inherently interactive, but it can become interactive when enhanced with features like tooltips, hover states, filtering, zooming, or selection.
 */
const meta: Meta<typeof ChartStory> = {
  title: 'Components/Chart',
  component: ChartStory,
  tags: ['autodocs'],
  parameters: {
  },
  args: {
    chartType: 'area',
    showGrid: true,
    showYAxis: false,
    showLegend: true,
    showTooltip: true,
    tooltipIndicator: 'dot',
  },
  argTypes: {
    chartType: { control: 'inline-radio', options: ['area', 'bar', 'line'] },
    showGrid: { control: 'boolean' },
    showYAxis: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    showTooltip: { control: 'boolean' },
    tooltipIndicator: { control: 'inline-radio', options: ['dot', 'line', 'dashed'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for the Chart component.
 */

// ==========================================
// PLAYGROUND
// ==========================================

export const Playground: Story = {
  render: (args) => <ChartStory {...args} />,
};

// ==========================================
// CHART TYPE STORIES
// ==========================================

export const Area: Story = {
  render: (args) => <ChartStory {...args} />,
  args: {
    chartType: 'area',
  },
  argTypes: {
    chartType: { control: { disable: true } },
  },
};

export const Bar: Story = {
  render: (args) => <ChartStory {...args} />,
  args: {
    chartType: 'bar',
  },
  argTypes: {
    chartType: { control: { disable: true } },
  },
};

export const Line: Story = {
  render: (args) => <ChartStory {...args} />,
  args: {
    chartType: 'line',
  },
  argTypes: {
    chartType: { control: { disable: true } },
  },
};

// ==========================================
// OPTION STORIES
// ==========================================

export const Minimal: Story = {
  render: (args) => <ChartStory {...args} />,
  args: {
    chartType: 'area',
    showGrid: false,
    showYAxis: false,
    showLegend: false,
    showTooltip: false,
  },
  argTypes: {
    chartType: { control: { disable: true } },
    showGrid: { control: { disable: true } },
    showYAxis: { control: { disable: true } },
    showLegend: { control: { disable: true } },
    showTooltip: { control: { disable: true } },
  },
};

export const DashedTooltipIndicator: Story = {
  render: (args) => <ChartStory {...args} />,
  args: {
    chartType: 'line',
    tooltipIndicator: 'dashed',
  },
  argTypes: {
    chartType: { control: { disable: true } },
    tooltipIndicator: { control: { disable: true } },
  },
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
