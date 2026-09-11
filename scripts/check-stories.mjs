// Story-presence gate: every design-system component folder must ship a story.
//
// Stories are the contract for visual components (see TESTING.md and the
// "Component testing & documentation" section of AGENTS.md): a story runs as a
// render test in the Vitest Storybook project, so a component without one is
// both undocumented and untested. This script promotes that convention from a
// written rule to a CI gate. It fails when any immediate child folder of
// src/components/ui/ has no *.stories.tsx file.
//
// Granularity: the check is one story per immediate folder, not per component
// file, and it does not recurse into subfolders (components are flat today). A
// folder passes as soon as it holds one *.stories.tsx. This gate proves a story
// exists, not that it is meaningful. Content validity (a story that renders and
// asserts) is the job of the Vitest Storybook project, which runs after it.

import { readdirSync } from "node:fs";
import { join } from "node:path";

const UI_DIR = "src/components/ui";

// Folders that legitimately ship without a story. Keep this empty by default.
// Add a folder here only with a comment stating why a story does not apply, so
// the escape hatch never turns into silent story rot.
const IGNORED = new Set([]);

function componentFolders() {
	let entries;
	try {
		entries = readdirSync(UI_DIR, { withFileTypes: true });
	} catch {
		// A gate that enforces nothing is worse than no gate: it goes green while
		// the convention rots. A missing directory means the path moved, so fail
		// loud with guidance rather than a raw stack trace.
		console.error(
			`Story-presence gate could not read ${UI_DIR}/. The path likely moved. Update scripts/check-stories.mjs.`,
		);
		process.exit(1);
	}

	return entries
		.filter((entry) => entry.isDirectory() && !IGNORED.has(entry.name))
		.map((entry) => entry.name);
}

function hasStory(folder) {
	return readdirSync(join(UI_DIR, folder)).some((file) =>
		file.endsWith(".stories.tsx"),
	);
}

const folders = componentFolders();

// The directory exists but holds no component folders (emptied, or all ignored).
// Fail loud rather than pass vacuously.
if (folders.length === 0) {
	console.error(
		`Story-presence gate found no component folders under ${UI_DIR}/. The directory is empty or every folder is ignored. Update scripts/check-stories.mjs.`,
	);
	process.exit(1);
}

const missing = folders.filter((folder) => !hasStory(folder));

if (missing.length > 0) {
	console.error(
		`Story-presence gate failed. ${missing.length} component folder(s) under ${UI_DIR}/ have no *.stories.tsx file:`,
	);
	for (const name of missing) {
		console.error(`  - ${UI_DIR}/${name}`);
	}
	console.error(
		"\nAdd a story for each component, or add the folder to IGNORED in scripts/check-stories.mjs with a reason.",
	);
	process.exit(1);
}

console.log(
	`Story-presence gate passed: ${folders.length} component folder(s) under ${UI_DIR}/, all with a story.`,
);
