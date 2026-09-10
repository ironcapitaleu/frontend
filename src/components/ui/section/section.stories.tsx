import type { Meta, StoryObj } from "@storybook/react-vite";

import { Heading } from "../heading";
import { Text } from "../text";
import { Container, Section } from "./section";

/**
 * A `Section` is a full-width page band with consistent padding, a vertical
 * rhythm, and an optional hairline divider. It pairs with `Container`, the
 * centered reading column that caps line length. Together they give every
 * static page the same measure and rhythm.
 */
const meta: Meta<typeof Section> = {
	title: "Components/Section",
	component: Section,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		spacing: {
			control: "select",
			options: ["default", "lg", "xl"],
			description: "Vertical rhythm of the band",
		},
		divider: {
			control: "select",
			options: ["none", "top", "bottom"],
			description: "Hairline rule that separates one band from the next",
		},
	},
	args: {
		spacing: "default",
		divider: "none",
	},
};

export default meta;
type Story = StoryObj<typeof Section>;

/** A single band holding a heading and a paragraph in the reading column. */
export const Playground: Story = {
	render: (args) => (
		<Section {...args}>
			<Container className="flex flex-col gap-6 text-center">
				<Heading variant="section">Timeless Principles</Heading>
				<Text>
					Everything we do is grounded in principles that have endured through
					time and continue to guide our judgment about the future.
				</Text>
			</Container>
		</Section>
	),
};

/** Two bands separated by a top divider, showing the vertical rhythm. */
export const StackedBands: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<>
			<Section spacing="xl">
				<Container className="flex flex-col gap-6 text-center">
					<Text size="display" tone="foreground" className="mx-auto max-w-4xl">
						Every successful investment begins with a deep understanding of the
						business.
					</Text>
				</Container>
			</Section>
			<Section divider="top">
				<Container className="flex flex-col gap-6 text-center">
					<Heading variant="section">Security Analysis</Heading>
					<Text>
						A security represents a claim on a real business, with real
						economics, real risks, and a real future.
					</Text>
				</Container>
			</Section>
		</>
	),
};

/** The wide reading column used by index-style pages such as the sitemap. */
export const WideContainer: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Section divider="bottom">
			<Container width="wide">
				<Heading level={1} variant="page">
					Sitemap
				</Heading>
			</Container>
		</Section>
	),
};
