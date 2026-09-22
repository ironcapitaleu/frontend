import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import StockScreener from "./StockScreener";

/**
 * The screener page with its built-in sample universe. The 1M column shows
 * gains in the `positive` token and losses in the `negative` token, so the
 * theme toggle checks both colors in light and dark. The decorator mirrors
 * `Layout` (a full-height flex column), and a router backs the row links.
 */
const meta: Meta<typeof StockScreener> = {
	title: "Pages/StockScreener",
	component: StockScreener,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<div className="min-h-screen flex flex-col">
					<Story />
				</div>
			</MemoryRouter>
		),
	],
	argTypes: {
		stocks: { control: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof StockScreener>;

/** The sample universe, with both gains and losses in the 1M column. */
export const Default: Story = {};

/** A phone width. The table scrolls sideways inside its frame. */
export const Mobile: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};
