// Collects the images a reviewer needs for every baseline the visual run moved.
//
// The `visual-diff` job runs the visual test twice: once to compare, once to
// write the new baselines. This script runs after both, and git is what it
// asks. A baseline that changed is a modified file in the working tree and a
// baseline that is new is an untracked one, whether or not the comparator
// managed to produce an overlay for it. Reading the attachments folder instead
// misses the cases that matter most: two images of different sizes cannot be
// overlaid at all, which is exactly what a layout change produces.
//
// It writes:
//
//   visual-diff-report/<baseline path>-old.png      the committed baseline
//   visual-diff-report/<baseline path>-new.png      what this branch renders
//   visual-diff-report/<baseline path>-overlay.png  the changed pixels in red
//   visual-diff-report/comment.md                   the PR comment body
//
// The old image comes from `git show`, so no copy has to be made before the
// update run. The overlay is present only when the comparator produced one.
//
// The overlay is the one view GitHub cannot render from a file diff, which is
// why it travels in the workflow artifact. Showing it inline in the comment
// needs a branch to host the images and is left to a follow-up ticket.

import { execFileSync } from "node:child_process";
import {
	appendFileSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const ATTACHMENTS_DIR = ".vitest-attachments";
const REPORT_DIR = "visual-diff-report";
const SCREENSHOTS_SEGMENT = "__screenshots__";
const BASELINE_PATHSPEC = `src/**/${SCREENSHOTS_SEGMENT}/**`;
const COMMENT_MARKER = "<!-- visual-diff -->";

// Set by the workflow from the outcome of the comparison step. A failure there
// is normal, because a moved baseline fails the assertion. A failure with no
// moved baseline to show for it means the run never got far enough to compare
// anything, which has to read differently from a clean run.
const comparisonFailed = process.env.VISUAL_COMPARE_OUTCOME === "failure";

/** Every file under a directory, recursively. Absent directory means no files. */
function walk(dir) {
	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

/**
 * Turns the path of a diff attachment into the path of the baseline it belongs
 * to.
 *
 * Vitest writes the attachment next to a mirror of the story path and the
 * baseline inside a `__screenshots__` folder, so the two differ in that one
 * segment and in the `-diff` marker in the file name:
 *
 *   .vitest-attachments/src/components/X.stories.tsx/story-desktop-diff-chromium-linux.png
 *   src/components/__screenshots__/X.stories.tsx/story-desktop-chromium-linux.png
 */
function baselinePathOf(diffAttachment) {
	const storyRelative = relative(ATTACHMENTS_DIR, diffAttachment);
	const storyDir = dirname(dirname(storyRelative));
	const storyFile = dirname(storyRelative).split("/").at(-1);
	const fileName = storyRelative.split("/").at(-1).replace("-diff-", "-");

	return join(storyDir, SCREENSHOTS_SEGMENT, storyFile, fileName);
}

/** The overlay each baseline got, for the ones the comparator could overlay. */
function overlaysByBaseline() {
	const overlays = new Map();

	for (const path of walk(ATTACHMENTS_DIR)) {
		if (path.includes("-diff-")) {
			overlays.set(baselinePathOf(path), path);
		}
	}

	return overlays;
}

/**
 * What the visual run did to the baselines, as git sees it.
 *
 * A rewritten baseline is modified and a first-time one is untracked. Git is
 * the authority here, so a baseline that changed without producing an overlay
 * is still reported rather than committed in silence.
 */
function baselineChanges() {
	const output = execFileSync(
		"git",
		["status", "--porcelain", "--untracked-files=all", "--", BASELINE_PATHSPEC],
		{ encoding: "utf8" },
	);

	const moved = [];
	const added = [];

	for (const line of output.split("\n").filter(Boolean)) {
		const path = line.slice(3).trim();

		if (line.startsWith("??")) {
			added.push(path);
		} else {
			moved.push(path);
		}
	}

	return { moved: moved.sort(), added: added.sort() };
}

/** Copies a file when it exists. Reports the miss instead of ending the run. */
function copyIfPresent(source, target) {
	if (source === undefined || !existsSync(source)) {
		console.warn(`No source for ${target}, leaving it out of the report.`);
		return;
	}

	mkdirSync(dirname(target), { recursive: true });
	copyFileSync(source, target);
}

/** Writes the committed version of a file, taken from the last commit. */
function writeCommittedVersion(path, target) {
	try {
		const content = execFileSync("git", ["show", `HEAD:${path}`], {
			encoding: "buffer",
			maxBuffer: 64 * 1024 * 1024,
		});

		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, content);
	} catch {
		console.warn(`No committed version of ${path}, leaving ${target} out.`);
	}
}

/** The comment body, or an empty string when there is nothing to report. */
function commentBody(moved, added) {
	if (comparedNothing(moved, added)) {
		return [
			COMMENT_MARKER,
			"## Visual regression",
			"",
			"The visual run did not finish, and it moved no baseline. That is not the same as no visual change: the comparison never happened, so this layer covered nothing on this push.",
			"",
			"Read the job log to find out why.",
		].join("\n");
	}

	if (moved.length === 0 && added.length === 0) {
		return "";
	}

	const lines = [
		COMMENT_MARKER,
		"## Visual regression",
		"",
		"This comment is rewritten on every push, so it always describes the current head.",
		"",
	];

	if (moved.length > 0) {
		lines.push(`### ${moved.length} baseline(s) moved`, "");
		for (const path of moved) {
			lines.push(`- \`${path}\``);
		}
		lines.push(
			"",
			"The new baselines are committed to this branch, so the file diff above shows every one of them. Use the 2-up, swipe, or onion-skin view to read a change.",
			"",
		);
	}

	if (added.length > 0) {
		lines.push(`### ${added.length} baseline(s) added`, "");
		for (const path of added) {
			lines.push(`- \`${path}\``);
		}
		lines.push(
			"",
			"A story with no baseline always reports as changed on its first run. There is nothing to compare it against yet.",
			"",
		);
	}

	lines.push(
		"The `visual-diff-report` artifact on this run holds the old image, the new image, and the red-pixel overlay for every baseline that moved. A baseline whose size changed has no overlay, because two images of different sizes cannot be compared pixel by pixel.",
		"",
		"Nothing here fails the build. Read the images and decide.",
	);

	return lines.join("\n");
}

/**
 * Whether the comparison never happened, as opposed to happening and finding
 * nothing.
 *
 * A failed comparison run normally leaves both a moved baseline and an image in
 * the attachments folder. A failure with neither means the suite stopped before
 * it compared anything, which has to read differently from a clean run. A
 * failure with an attachment but no moved baseline is the harmless case where a
 * hand-edited baseline was put back, so it stays quiet.
 */
function comparedNothing(moved, added) {
	if (!comparisonFailed || moved.length > 0 || added.length > 0) {
		return false;
	}

	return !walk(ATTACHMENTS_DIR).some(
		(path) => path.includes("-diff-") || path.includes("-reference-"),
	);
}

const overlays = overlaysByBaseline();
const { moved, added } = baselineChanges();

for (const baseline of moved) {
	const stem = join(REPORT_DIR, baseline.replace(/\.png$/, ""));

	writeCommittedVersion(baseline, `${stem}-old.png`);
	copyIfPresent(baseline, `${stem}-new.png`);

	// Two images of different sizes cannot be compared pixel by pixel, so a
	// baseline whose size changed has no overlay. Everything else about it is
	// still reported.
	copyIfPresent(overlays.get(baseline), `${stem}-overlay.png`);
}

for (const baseline of added) {
	const stem = join(REPORT_DIR, baseline.replace(/\.png$/, ""));

	copyIfPresent(baseline, `${stem}-new.png`);
}

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(join(REPORT_DIR, "comment.md"), commentBody(moved, added));

// Reported here rather than re-derived at the end of the job, because the
// commit step stages the baselines and git stops calling them changed.
if (process.env.GITHUB_OUTPUT !== undefined) {
	appendFileSync(
		process.env.GITHUB_OUTPUT,
		`compared-nothing=${comparedNothing(moved, added)}\n`,
	);
}

console.log(
	`Visual diff report: ${moved.length} baseline(s) moved, ${added.length} added.`,
);
