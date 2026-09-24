import type { Meta, StoryObj } from "@storybook/react-vite";

import { ownershipShares, revenueShare } from "@/lib/company/metrics";
import { meridianOverview } from "@/lib/company/sample/overview";
import type { Claim } from "@/lib/company/types";
import { ShareBar, type SharePart } from "./ShareBar";

const segments: SharePart[] = meridianOverview.segments.map((part, index) => ({
	label: part.name,
	share: revenueShare(meridianOverview, "segments", index),
}));

const ownership = ownershipShares(meridianOverview);

/**
 * The bar of shares of the company page, with the sample company Meridian
 * Semiconductor. The stories cover a full split, a missing share, shares that
 * sum above 100%, and the phone width.
 */
const meta: Meta<typeof ShareBar> = {
	title: "Company/ShareBar",
	component: ShareBar,
	tags: ["autodocs"],
	args: { "aria-label": "Revenue by segment", parts: segments },
	decorators: [
		(Story) => (
			<div className="max-w-xl p-6">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ShareBar>;

/** The revenue split by segment. The shares sum to 100%. */
export const Full: Story = {};

/**
 * The ownership split with the public share missing. It prints a dimmed `—`
 * and draws no segment, and the rest of the bar stays empty.
 */
export const Missing: Story = {
	args: {
		"aria-label": "Ownership",
		parts: [
			{ label: "Institutions", share: ownership.institutions },
			{ label: "Insiders", share: ownership.insiders },
			{ label: "Public", share: null },
		],
	},
};

/** The shares sum to 120%. The bar shrinks them to fit and the labels print the true shares. */
export const OverHundred: Story = {
	args: {
		"aria-label": "Ownership",
		parts: [
			{
				label: "Institutions",
				share: { ...(ownership.institutions as Claim), value: 0.8 },
			},
			{
				label: "Insiders",
				share: { ...(ownership.insiders as Claim), value: 0.4 },
			},
		],
	},
};

/** On a phone the labels stack in one column. */
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};
