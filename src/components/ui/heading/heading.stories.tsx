import type { Meta, StoryObj } from "@storybook/react-vite";

import { VariantShowcase } from "../../../../.storybook/utils/showcaseDecorators";
import { Heading } from "./heading";
import { HEADING_VARIANTS } from "./variants";

/**
 * A `Heading` carries the classical voice of the product. The `level` prop sets
 * the document level (`<h1>` to `<h6>`) apart from the visual `variant`, so the
 * outline stays correct while the look is chosen by design.
 */
const meta: Meta<typeof Heading> = {
	title: "Components/Heading",
	component: Heading,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: HEADING_VARIANTS,
			description: "Visual role of the heading",
		},
		children: {
			control: "text",
			description: "Heading content",
		},
	},
	args: {
		children: "Timeless Principles",
		variant: "section",
	},
};

export default meta;
type Story = StoryObj<typeof Heading>;

/** Interactive playground. Use the controls to explore every variant. */
export const Playground: Story = {};

/** Every heading variant shown together for comparison. */
export const AllVariants: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<VariantShowcase
			Component={Heading}
			variants={[...HEADING_VARIANTS]}
			variantKey="variant"
			baseProps={{ children: "Timeless Principles" }}
		/>
	),
};
