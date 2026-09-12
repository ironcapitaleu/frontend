// Compares two capture runs of the same stories and reports what moved.
//
// Nothing is stored between runs. The `visual-diff` job renders the covered
// stories twice, once from the base branch and once from the pull request head,
// and this script compares the two directories. No image is ever committed, so
// the repository does not grow by a single byte however many times a baseline
// changes.
//
// That is the whole reason the design works this way. A committed baseline is a
// permanent blob, PNG files do not delta-compress, and deleting them later
// reclaims nothing, so every change to a rendered story would add weight to the
// repository forever.
//
// It writes:
//
//   <report>/<story path>/<name>-old.png      what the base branch renders
//   <report>/<story path>/<name>-new.png      what this branch renders
//   <report>/<story path>/<name>-overlay.png  the changed pixels in red
//   <report>/comment.md                       the PR comment body
//
// A story whose image changed size has no overlay, because two images of
// different sizes cannot be compared pixel by pixel. Both images are still
// reported.
//
// This script never fails the build. It reports, and the human PR review is the
// gate, which is level 3 of the enforcement ladder in AGENTS.md.

import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const BASE_DIR = process.env.VISUAL_BASE_DIR ?? ".visual-run/base";
const HEAD_DIR = process.env.VISUAL_HEAD_DIR ?? ".visual-run/head";
const REPORT_DIR = process.env.VISUAL_REPORT_DIR ?? "visual-diff-report";
const COMMENT_MARKER = "<!-- visual-diff -->";

/**
 * The share of pixels allowed to differ before a capture counts as changed.
 *
 * The spike ran the same story three times and got zero mismatched pixels every
 * time, so this is not headroom for expected drift. It is a margin for the rare
 * sub-pixel difference in text rendering. At the 1440 by 900 desktop viewport it
 * works out at about 260 pixels, far below anything a reviewer sees.
 */
const ALLOWED_MISMATCHED_PIXEL_RATIO = 0.0002;

/** Every file under a directory, as paths relative to it. */
function captures(dir) {
	if (!existsSync(dir)) {
		return [];
	}

	const walk = (current) =>
		readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
			const path = join(current, entry.name);
			return entry.isDirectory() ? walk(path) : [relative(dir, path)];
		});

	return walk(dir).sort();
}

/** Copies a capture into the report, creating the folders above it. */
function copyInto(source, target) {
	mkdirSync(dirname(target), { recursive: true });
	copyFileSync(source, target);
}

/**
 * Compares one story's two captures.
 *
 * Returns how they differ, and writes the overlay when one can be drawn. A size
 * change is reported on its own, because pixelmatch needs two images of the same
 * dimensions and a layout change is exactly what alters them.
 */
function compare(capture) {
	const oldImage = PNG.sync.read(readFileSync(join(BASE_DIR, capture)));
	const newImage = PNG.sync.read(readFileSync(join(HEAD_DIR, capture)));

	if (
		oldImage.width !== newImage.width ||
		oldImage.height !== newImage.height
	) {
		return {
			verdict: "resized",
			detail: `${oldImage.width}x${oldImage.height} to ${newImage.width}x${newImage.height}`,
		};
	}

	const overlay = new PNG({ width: newImage.width, height: newImage.height });
	const mismatched = pixelmatch(
		oldImage.data,
		newImage.data,
		overlay.data,
		newImage.width,
		newImage.height,
	);

	const area = newImage.width * newImage.height;
	if (mismatched / area <= ALLOWED_MISMATCHED_PIXEL_RATIO) {
		return { verdict: "same", detail: "" };
	}

	const stem = join(REPORT_DIR, capture.replace(/\.png$/, ""));
	mkdirSync(dirname(stem), { recursive: true });
	writeFileSync(`${stem}-overlay.png`, PNG.sync.write(overlay));

	return {
		verdict: "moved",
		detail: `${mismatched} pixels (${((mismatched / area) * 100).toFixed(2)}%)`,
	};
}

/** The comment body, or an empty string when nothing changed. */
function commentBody(changed, added, removed) {
	if (changed.length === 0 && added.length === 0 && removed.length === 0) {
		return "";
	}

	const lines = [
		COMMENT_MARKER,
		"## Visual regression",
		"",
		"This comment is rewritten on every push, so it always describes the current head.",
		"",
		"Nothing is stored between runs. Both images are rendered fresh, one from the base branch and one from this branch, so no screenshot is ever committed.",
		"",
	];

	if (changed.length > 0) {
		lines.push(`### ${changed.length} story image(s) changed`, "");
		for (const { capture, detail, verdict } of changed) {
			const note = verdict === "resized" ? `size changed, ${detail}` : detail;
			lines.push(`- \`${capture}\` — ${note}`);
		}
		lines.push("");
	}

	if (added.length > 0) {
		lines.push(`### ${added.length} story image(s) added`, "");
		for (const capture of added) {
			lines.push(`- \`${capture}\``);
		}
		lines.push(
			"",
			"These stories do not exist on the base branch, so there is nothing to compare them against.",
			"",
		);
	}

	if (removed.length > 0) {
		lines.push(`### ${removed.length} story image(s) removed`, "");
		for (const capture of removed) {
			lines.push(`- \`${capture}\``);
		}
		lines.push("");
	}

	lines.push(
		"The `visual-diff-report` artifact on this run holds the before image, the after image, and the red-pixel overlay for each one. A story whose image changed size has no overlay, because two images of different sizes cannot be compared pixel by pixel.",
		"",
		"Nothing here fails the build. Read the images and decide.",
	);

	return lines.join("\n");
}

const baseCaptures = new Set(captures(BASE_DIR));
const headCaptures = captures(HEAD_DIR);

const changed = [];
const added = [];

for (const capture of headCaptures) {
	const stem = join(REPORT_DIR, capture.replace(/\.png$/, ""));

	if (!baseCaptures.has(capture)) {
		copyInto(join(HEAD_DIR, capture), `${stem}-new.png`);
		added.push(capture);
		continue;
	}

	const { verdict, detail } = compare(capture);

	if (verdict === "same") {
		continue;
	}

	copyInto(join(BASE_DIR, capture), `${stem}-old.png`);
	copyInto(join(HEAD_DIR, capture), `${stem}-new.png`);
	changed.push({ capture, verdict, detail });
}

const removed = [...baseCaptures].filter(
	(capture) => !headCaptures.includes(capture),
);

for (const capture of removed) {
	const stem = join(REPORT_DIR, capture.replace(/\.png$/, ""));
	copyInto(join(BASE_DIR, capture), `${stem}-old.png`);
}

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(
	join(REPORT_DIR, "comment.md"),
	commentBody(changed, added, removed),
);

console.log(
	`Visual comparison: ${changed.length} changed, ${added.length} added, ${removed.length} removed, out of ${headCaptures.length} captured.`,
);
