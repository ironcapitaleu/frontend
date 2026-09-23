import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import SearchBar from "./SearchBar";

/**
 * The search field with the flowing gradient glow, the modern spark of the
 * design language (DESIGN.md §5). Without props it carries the home page's
 * placeholder and label. A page controls it with `value` and `onChange`.
 */
const meta: Meta<typeof SearchBar> = {
	title: "Components/SearchBar",
	component: SearchBar,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The home page's search, uncontrolled. */
export const Default: Story = {};

/**
 * Controlled by the page, as the screener masthead does. The placeholder and
 * the label name what the field searches.
 */
export const Controlled: Story = {
	render: () => {
		const [value, setValue] = useState("ALFA");
		return (
			<SearchBar
				placeholder="Search by ticker or company"
				aria-label="Search by ticker or company"
				value={value}
				onChange={(event) => setValue(event.target.value)}
			/>
		);
	},
};
