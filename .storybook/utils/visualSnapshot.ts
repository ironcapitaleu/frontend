// Pixel-level visual regression capture for Storybook stories (STA-180).
//
// This is the third test layer named in TESTING.md section 3. It runs inside a
// story's play function under the existing `storybook` Vitest project, so it
// needs no new runner and no new dependency: `toMatchScreenshot` already ships
// with Vitest browser mode.
//
// Nothing is stored between runs. The `visual-diff` job renders the covered
// stories twice, once from the base branch and once from the pull request head,
// and compares the two. No screenshot is committed, so the repository does not
// grow by a byte however often a rendered story changes. A committed baseline
// would be a permanent blob, because PNG files do not delta-compress and
// deleting them later reclaims nothing.
//
// Two rules follow from that:
//
// 1. This helper captures, it does not compare. Each call writes one image per
//    viewport, and scripts/compare-visual-runs.mjs decides what changed.
// 2. Nothing in this layer fails a build. The job runs beside `ci` and reports.
//    The human PR review is the gate.
//
// Font rendering differs between operating systems, which no longer breaks
// anything: both sides of every comparison are rendered in the same container
// on the same run.
//
// The capture is opt-in through VISUAL=1, so `npm run test:storybook` in the
// gating `ci` job and on a developer machine behaves exactly as it did before
// this file existed.

// `expect` comes from vitest rather than `storybook/test`, which is what every
// other play function in this repository uses. The `toMatchScreenshot`
// assertion is part of Vitest browser mode and is not re-exported there.
import { expect } from "vitest";
import { page } from "vitest/browser";

/**
 * Viewport widths the capture loops over, with the height each one renders at.
 *
 * Two widths to start: one below every Tailwind breakpoint the components use
 * (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) and one above all of them, so a
 * layout change at any breakpoint lands on one side or the other.
 *
 * TESTING.md section 4.1 asks for a component's own breakpoints rather than a
 * device list, which is what the second part of this rollout adds. Doing that
 * needs the scrollbar margin handled: a scrollbar takes about 15 pixels off the
 * usable width, so a viewport of exactly 768 renders as 753 and drops to the
 * layout below it. Pick a width a little above the breakpoint, never on it.
 *
 * Every size here has to fit inside the Playwright page that `vite.config.ts`
 * sets. A viewport larger than that page is scaled down to fit, and the capture
 * records the scaled pixels rather than the real ones.
 */
export const VISUAL_VIEWPORTS = {
	mobile: { width: 390, height: 844 },
	desktop: { width: 1440, height: 900 },
} as const;

type ViewportName = keyof typeof VISUAL_VIEWPORTS;

/**
 * The size the page is handed back at.
 *
 * Storybook runs every story of a run in one browser page, so a viewport left
 * at the last captured size is the size the next story renders at. This is the
 * size this project starts a run at, measured by reading `window.innerWidth`
 * and `window.innerHeight` in a story that changes nothing.
 */
const DEFAULT_VIEWPORT = { width: 1200, height: 900 } as const;

/** Identifies the stylesheet the capture adds, so it can be taken out again. */
const FREEZE_STYLE_ID = "visual-snapshot-freeze";

/** The outcome recorded for a viewport that was captured. */
const CAPTURED = "captured";

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
	if (document.getElementById(FREEZE_STYLE_ID) !== null) {
		return;
	}

	const style = document.createElement("style");
	style.id = FREEZE_STYLE_ID;
	style.textContent = FREEZE_STYLE;
	document.head.appendChild(style);
}

/**
 * Puts the page back the way it was found.
 *
 * Every story of a run shares one browser page, so a story that leaves the
 * motion frozen or the viewport at 1440 hands both to whichever story runs
 * next. That turns into a failure in an unrelated story that depends on file
 * ordering, which is the hardest kind to read.
 */
async function restorePage(): Promise<void> {
	document.getElementById(FREEZE_STYLE_ID)?.remove();
	await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height);
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
 * Writes one viewport to disk and turns the outcome into a value.
 *
 * TESTING.md section 1.2 allows exactly one `expect` per test, so the helper
 * cannot assert once per viewport. It records the outcome of each one instead
 * and compares the whole set in a single assertion, which is the composite
 * outcome pattern that section already describes.
 *
 * The run always passes `--update`, so `toMatchScreenshot` writes the image
 * rather than comparing it. `vite.config.ts` sends it to VISUAL_OUT_DIR, which
 * the job points at one directory for this branch and another for the base.
 */
async function captureViewport(name: string, viewport: ViewportName) {
	try {
		await expect(page.elementLocator(document.body)).toMatchScreenshot(
			`${name}-${viewport}`,
		);

		return CAPTURED;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

/**
 * Captures the story at every viewport and asserts that all of them were
 * written.
 *
 * Call it as the last step of a play function. It ends the play function in one
 * assertion, and it does nothing at all unless VISUAL=1 is set.
 *
 * @param name - The image file name, without the viewport part. Each image is
 *   written to `<VISUAL_OUT_DIR>/<story dir>/<story file>/<name>-<viewport>.png`.
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

	const viewports = Object.keys(VISUAL_VIEWPORTS) as ViewportName[];

	const expectedResult = Object.fromEntries(
		viewports.map((viewport) => [viewport, CAPTURED]),
	);

	const result: Record<string, string> = {};
	try {
		freezeMotion();

		for (const viewport of viewports) {
			const { width, height } = VISUAL_VIEWPORTS[viewport];
			await page.viewport(width, height);
			await settle();
			result[viewport] = await captureViewport(name, viewport);
		}
	} finally {
		await restorePage();
	}

	expect(result).toEqual(expectedResult);
}
