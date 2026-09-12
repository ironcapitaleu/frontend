// Collects the three images a reviewer needs for every story whose pixels moved.
//
// The `visual-diff` job runs the visual test twice: once to compare, once to
// write the new baselines. This script runs between the two, while the working
// tree still holds the OLD baseline and the attachments folder already holds the
// NEW render and the red-pixel overlay.
//
// It produces two things:
//
//   visual-diff-report/<story path>/<name>-old.png      the committed baseline
//   visual-diff-report/<story path>/<name>-new.png      what this branch renders
//   visual-diff-report/<story path>/<name>-overlay.png  the changed pixels in red
//   visual-diff-report/comment.md                       the PR comment body
//
// The overlay is the one view GitHub cannot render from a file diff, which is
// why it travels in the workflow artifact. Showing it inline in the comment
// needs a branch to host the images and is left to a follow-up ticket.

import { execFileSync } from "node:child_process";
import {
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
const COMMENT_MARKER = "<!-- visual-diff -->";

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

/** Copies a file, creating the folders above it. */
function copyInto(source, target) {
	mkdirSync(dirname(target), { recursive: true });
	copyFileSync(source, target);
}

/**
 * Baselines this run created from nothing, which git sees as untracked.
 *
 * The report folder mirrors the baseline paths, so it is excluded by name.
 * Without that it reports its own copies as new baselines.
 */
function newBaselines(changed) {
	const output = execFileSync(
		"git",
		[
			"status",
			"--porcelain",
			"--untracked-files=all",
			"--",
			`src/**/${SCREENSHOTS_SEGMENT}/**`,
		],
		{ encoding: "utf8" },
	);

	return output
		.split("\n")
		.filter((line) => line.startsWith("?? "))
		.map((line) => line.slice(3).trim())
		.filter(
			(path) => !path.startsWith(`${REPORT_DIR}/`) && !changed.includes(path),
		);
}

/** The comment body, or an empty string when nothing moved. */
function commentBody(changed, added) {
	if (changed.length === 0 && added.length === 0) {
		return "";
	}

	const lines = [
		COMMENT_MARKER,
		"## Visual regression",
		"",
		"This comment is rewritten on every push, so it always describes the current head.",
		"",
	];

	if (changed.length > 0) {
		lines.push(`### ${changed.length} baseline(s) moved`, "");
		for (const path of changed) {
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
		"The `visual-diff-report` artifact on this run holds the old image, the new image, and the red-pixel overlay for every baseline that moved.",
		"",
		"Nothing here fails the build. Read the images and decide.",
	);

	return lines.join("\n");
}

const diffAttachments = walk(ATTACHMENTS_DIR).filter((path) =>
	path.includes("-diff-"),
);

const changed = [];
for (const diffAttachment of diffAttachments) {
	const baseline = baselinePathOf(diffAttachment);
	const renderedAttachment = diffAttachment.replace("-diff-", "-actual-");
	const stem = join(REPORT_DIR, baseline.replace(/\.png$/, ""));

	copyInto(baseline, `${stem}-old.png`);
	copyInto(renderedAttachment, `${stem}-new.png`);
	copyInto(diffAttachment, `${stem}-overlay.png`);

	changed.push(baseline);
}

const added = newBaselines(changed);

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(
	join(REPORT_DIR, "comment.md"),
	commentBody(changed.sort(), added.sort()),
);

console.log(
	`Visual diff report: ${changed.length} baseline(s) moved, ${added.length} added.`,
);
