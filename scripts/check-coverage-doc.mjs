// Coverage-doc gate: the floor table in TESTING.md §7 must match the
// coverage.thresholds in vite.config.ts.
//
// TESTING.md §7 is the document a developer reads when the coverage gate
// fails. If its Floor column drifts from the config, it sends them after the
// wrong number. This script promotes "update both together" from a written
// rule to a CI gate (see "The Enforcement Ladder" in AGENTS.md). It fails when
// a metric is missing from either file, or when the two floors differ.

import { readFileSync } from "node:fs";

const CONFIG = "vite.config.ts";
const DOC = "TESTING.md";
const METRICS = ["statements", "branches", "functions", "lines"];

// Read a file, failing loud with guidance instead of a raw stack trace.
function readOrExit(path) {
	try {
		return readFileSync(path, "utf8");
	} catch (error) {
		console.error(
			`Coverage-doc gate could not read ${path}. The path likely moved. Update scripts/check-coverage-doc.mjs. Cause: ${error.code ?? error.message}.`,
		);
		process.exit(1);
	}
}

const thresholds = readOrExit(CONFIG).match(/thresholds:\s*\{([^}]*)\}/)?.[1];
if (thresholds === undefined) {
	console.error(
		`Coverage-doc gate found no coverage.thresholds block in ${CONFIG}. Update scripts/check-coverage-doc.mjs.`,
	);
	process.exit(1);
}
const doc = readOrExit(DOC);

const problems = METRICS.flatMap((metric) => {
	const label = metric[0].toUpperCase() + metric.slice(1);
	const floor = thresholds.match(new RegExp(`\\b${metric}:\\s*(\\d+)`))?.[1];
	// The last cell of the metric's row in the §7 table is its floor.
	const row = doc.match(
		new RegExp(`^\\|\\s*${label}\\s*\\|.*\\|\\s*(\\d+)%\\s*\\|\\s*$`, "m"),
	);
	const documented = row?.[1];
	if (floor === undefined) return [`${metric}: no floor in ${CONFIG}`];
	if (documented === undefined)
		return [`${metric}: no row in the ${DOC} §7 table`];
	if (floor !== documented) {
		return [`${metric}: ${CONFIG} says ${floor}%, ${DOC} says ${documented}%`];
	}
	return [];
});

if (problems.length > 0) {
	console.error(
		"Coverage-doc gate failed. TESTING.md §7 disagrees with vite.config.ts:",
	);
	for (const problem of problems) {
		console.error(`  - ${problem}`);
	}
	console.error(
		"\nUpdate the Floor column in TESTING.md §7 to match coverage.thresholds.",
	);
	process.exit(1);
}

console.log(
	`Coverage-doc gate passed: TESTING.md §7 matches the ${METRICS.length} floors in ${CONFIG}.`,
);
