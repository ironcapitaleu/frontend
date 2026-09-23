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
 * Its hit area is 44 by 44 px and stays inside the chip's right edge. It
 * covers the right end of the chip, so a click on a short bound such as `DE`
 * removes the filter. With no bound, a click on the tail of the label does.
 * The hit area also reaches 8 px above and below the chip, so a chip row needs
 * at least that much clear space above and below it.
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

/**
 * A wrapped row of chips, as the screener shows them. The remove targets stay
 * inside their own chips, so a click on one chip never removes its neighbor.
 * The 12 px `gap-y-3` between rows clears the 8 px vertical reach, so keep
 * the row gap at least that wide.
 */
export const Row: Story = {
	render: (args) => (
		<div className="flex w-72 flex-wrap gap-x-1.5 gap-y-3">
			<FilterChip {...args} />
			<FilterChip
				label="Dividend yield"
				value="≥ 2%"
				onRemove={args.onRemove}
			/>
			<FilterChip label="Country" value="DE" onRemove={args.onRemove} />
			<FilterChip label="Near 52-week low" onRemove={args.onRemove} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const chip = canvas
			.getByText("P/E")
			.closest('[data-slot="filter-chip"]') as HTMLElement;
		const box = chip.getBoundingClientRect();
		const neighbor = canvas
			.getByText("Dividend yield")
			.closest('[data-slot="filter-chip"]') as HTMLElement;

		const expectedResult = {
			neighbor: "on the same row",
			chipAtRightEdge: "none",
		};

		// Deviation from TESTING.md §2.2: a hit area has no accessible query, so
		// a hit test just past the chip's right edge checks its geometry. The
		// point belongs to no chip, so neither this chip nor its neighbor
		// reaches into the gap.
		const hit = canvasElement.ownerDocument.elementFromPoint(
			box.right + 1,
			box.top + box.height / 2,
		);
		const owner = hit?.closest('[data-slot="filter-chip"]') ?? null;
		const result = {
			neighbor:
				neighbor.getBoundingClientRect().top === box.top
					? "on the same row"
					: "wrapped to the next row",
			chipAtRightEdge:
				hit === null
					? "nothing, the chip is off screen"
					: owner === null
						? "none"
						: (owner.textContent ?? ""),
		};

		await expect(result).toEqual(expectedResult);
	},
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
