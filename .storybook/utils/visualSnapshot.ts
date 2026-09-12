// Pixel-level visual regression capture for Storybook stories (STA-180).
//
// This is the third test layer named in TESTING.md section 3. It runs inside a
// story's play function under the existing `storybook` Vitest project, so it
// needs no new runner and no new dependency: `toMatchScreenshot` already ships
// with Vitest browser mode.
//
// Two rules from the STA-143 spike shape everything here:
//
// 1. Only CI writes baselines. Font rendering differs between operating
//    systems, so a baseline generated on a developer machine breaks the Linux
//    CI job. Run `npm run test:visual:update` in the CI container, never
//    locally.
// 2. Nothing in this layer fails a build. The `visual-diff` job runs beside
//    `ci`, commits what changed, and reports. The human PR review is the gate.
//
// The capture is opt-in through VISUAL=1, so `npm run test:storybook` in the
// gating `ci` job and on a developer machine behaves exactly as it did before
// this file existed.

import { page } from "vitest/browser";
import { expect } from "vitest";

/**
 * Viewport widths the capture loops over, with the height each one renders at.
 *
 * The widths follow the Tailwind breakpoints the components themselves use
 * (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) rather than a device list. Each
 * one sits well inside a range instead of on its edge, because a scrollbar
 * takes about 15 pixels off the usable width: a viewport of exactly 768 renders
 * as 753 and drops to the layout below it, which makes the baseline depend on
 * whether the story happens to overflow.
 */
export const VISUAL_VIEWPORTS = {
	mobile: { width: 390, height: 844 },
	desktop: { width: 1440, height: 900 },
} as const;

type ViewportName = keyof typeof VISUAL_VIEWPORTS;

/**
 * The share of pixels allowed to differ before a capture counts as changed.
 *
 * The spike ran the same story three times and got zero mismatched pixels every
 * time, so this is not headroom for expected drift. It is a margin for the rare
 * sub-pixel difference in text rendering. At the 1440 by 900 desktop viewport it
 * works out at about 260 pixels, which is far below anything a reviewer sees.
 */
const ALLOWED_MISMATCHED_PIXEL_RATIO = 0.0002;

/** The outcome recorded for a viewport that matched its baseline. */
const MATCHES_BASELINE = "matches baseline";

/**
 * Whether the capture runs at all.
 *
 * `vite.config.ts` maps the VISUAL environment variable into the `storybook`
 * project, so the flag reaches the browser. Without it every helper call returns
 * straight away and the story stays a plain render test.
 */
const visualCaptureEnabled = import.meta.env.VISUAL === "1";

/**
 * CSS that holds the page still for the moment of the capture.
 *
 * Animations and transitions are the main source of a baseline that differs
 * from one run to the next, because the capture lands at whatever frame the
 * clock reached. Zeroing both durations and delays settles every one of them at
 * its end state, including the `grid-template-rows` height animation the mobile
 * menu uses. The transparent caret covers a story whose play function focuses a
 * field, so no blinking cursor reaches the image.
 */
const FREEZE_STYLE = `
*, *::before, *::after {
	animation-delay: 0s !important;
	animation-duration: 0s !important;
	transition-delay: 0s !important;
	transition-duration: 0s !important;
	caret-color: transparent !important;
	scroll-behavior: auto !important;
}
`;

/** Adds the freeze stylesheet once, however many stories call the helper. */
function freezeMotion(): void {
	const id = "visual-snapshot-freeze";

	if (document.getElementById(id) !== null) {
		return;
	}

	const style = document.createElement("style");
	style.id = id;
	style.textContent = FREEZE_STYLE;
	document.head.appendChild(style);
}

/**
 * Waits until the page is ready to be photographed.
 *
 * `document.fonts.ready` is the important one. Without it the capture can land
 * while the browser still shows the fallback font, which produces a baseline no
 * later run reproduces. The animation frame that follows lets the new viewport
 * size reach layout before the pixels are read.
 */
async function settle(): Promise<void> {
	await document.fonts.ready;
	await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

/**
 * Captures one viewport and turns the assertion into a value.
 *
 * TESTING.md section 1.2 allows exactly one `expect` per test, so the helper
 * cannot assert once per viewport. It records the outcome of each one instead
 * and compares the whole set in a single assertion, which is the composite
 * outcome pattern that section already describes. The failure message is kept
 * as the recorded value, so a mismatch still names the pixel count and the file
 * it wrote.
 */
async function captureViewport(name: string, viewport: ViewportName) {
	try {
		await expect(page.elementLocator(document.body)).toMatchScreenshot(
			`${name}-${viewport}`,
			{
				comparatorOptions: {
					allowedMismatchedPixelRatio: ALLOWED_MISMATCHED_PIXEL_RATIO,
				},
			},
		);

		return MATCHES_BASELINE;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

/**
 * Captures the story at every viewport and asserts that all of them match their
 * committed baseline.
 *
 * Call it as the last step of a play function. It ends the play function in one
 * assertion, and it does nothing at all unless VISUAL=1 is set.
 *
 * @param name - The baseline file name, without the viewport, browser, or
 *   platform parts. Vitest writes each image to
 *   `<story dir>/__screenshots__/<story file>/<name>-<viewport>-<browser>-<platform>.png`.
 *
 * @example
 * ```ts
 * export const LightDesktop: Story = {
 *   globals: { theme: "light" },
 *   play: async () => {
 *     await captureVisualSnapshots("glow-nav-bar-light");
 *   },
 * };
 * ```
 */
export async function captureVisualSnapshots(name: string): Promise<void> {
	if (!visualCaptureEnabled) {
		return;
	}

	freezeMotion();

	const viewports = Object.keys(VISUAL_VIEWPORTS) as ViewportName[];

	const expectedResult = Object.fromEntries(
		viewports.map((viewport) => [viewport, MATCHES_BASELINE]),
	);

	const result: Record<string, string> = {};
	for (const viewport of viewports) {
		const { width, height } = VISUAL_VIEWPORTS[viewport];
		await page.viewport(width, height);
		await settle();
		result[viewport] = await captureViewport(name, viewport);
	}

	expect(result).toEqual(expectedResult);
}
