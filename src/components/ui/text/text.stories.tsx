import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text, TextLink } from "./text";
import { TEXT_FONTS, TEXT_SIZES, TEXT_TONES } from "./variants";

/**
 * `Text` is a paragraph of copy with the house font, size, and tone. It renders
 * a `<p>` by default and takes a `render` element for another tag (a `<span>`
 * for a decorative label, a `<ul>` for a list). `TextLink` is the inline link
 * for running copy, rendered as an `<a>` unless a `render` element routes it
 * through the client.
 */
const meta: Meta<typeof Text> = {
	title: "Components/Text",
	component: Text,
	tags: ["autodocs"],
	argTypes: {
		font: {
			control: "select",
			options: TEXT_FONTS,
			description: "Font role: the classical voice or the plain working sans",
		},
		size: {
			control: "select",
			options: TEXT_SIZES,
			description: "Type size, from a small caption up to a hero statement",
		},
		tone: {
			control: "select",
			options: TEXT_TONES,
			description: "Ink weight of the copy",
		},
		children: {
			control: "text",
			description: "Copy content",
		},
	},
	args: {
		children:
			"A security is not a blinking number on a screen. It represents a claim on a real business.",
		font: "classic",
		size: "base",
		tone: "muted",
	},
};

export default meta;
type Story = StoryObj<typeof Text>;

/** Interactive playground. Use the controls to explore font, size, and tone. */
export const Playground: Story = {};

/** A hero statement in the classical display size. */
export const Display: Story = {
	args: {
		size: "display",
		tone: "foreground",
		children:
			"Every successful investment begins with a deep understanding of the business.",
	},
};

/** A small caption in the working sans font. */
export const Caption: Story = {
	args: {
		font: "sans",
		size: "sm",
		children: "Last updated: 18 March 2026",
	},
};

/** The two inline link treatments used inside running copy and index lists. */
export const Links: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<div className="flex flex-col gap-4">
			<Text>
				You can reach us at{" "}
				<TextLink href="mailto:contact@ironcapital.eu">
					contact@ironcapital.eu
				</TextLink>
				.
			</Text>
			<TextLink variant="subtle" href="/about" className="text-sm font-medium">
				About
			</TextLink>
		</div>
	),
};
