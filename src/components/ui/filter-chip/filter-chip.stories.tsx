import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FilterChip } from ".";

/**
 * A `FilterChip` names one active filter, with its bound in mono and a button
 * that removes it. The screener shows a row of chips above the results. The
 * chip sits on the `muted` surface with a hairline `border`, so it reads as a
 * quiet tag next to the result count.
 *
 * The remove button is labelled "Remove {label} filter" for screen readers.
 * Its hit area reaches 44 px on every side of the small icon.
 */
const meta: Meta<typeof FilterChip> = {
	title: "Components/FilterChip",
	component: FilterChip,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	argTypes: {
		label: { control: "text", description: "Names the filter." },
		value: { control: "text", description: "The bound, in mono." },
		onRemove: { control: { disable: true } },
		className: { control: { disable: true } },
	},
	args: {
		label: "P/E",
		value: "≤ 20",
		onRemove: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** One numeric bound, driven from the Controls panel. */
export const Playground: Story = {};

/** A switch filter has no bound, so the chip shows only its label. */
export const WithoutValue: Story = {
	args: { label: "Near 52-week low", value: "" },
};

/**
 * A long label truncates inside a narrow row, and the bound and the remove
 * button stay visible.
 */
export const LongLabel: Story = {
	args: { label: "Current ratio of the latest fiscal year", value: "≥ 1.5" },
	decorators: [
		(Story) => (
			<div className="w-48">
				<Story />
			</div>
		),
	],
};

/** Clicking the remove button calls `onRemove` once. */
export const RemovesOnClick: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const removeButton = canvas.getByRole("button", {
			name: "Remove P/E filter",
		});

		const expectedResult = 1;

		await userEvent.click(removeButton);
		const result = (args.onRemove as ReturnType<typeof fn>).mock.calls.length;

		await expect(result).toBe(expectedResult);
	},
};
