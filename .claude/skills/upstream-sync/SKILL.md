---
name: upstream-sync
description: >
  This skill should be used when the user asks to "sync with arkad", "sync upstream",
  "check the gold standard repo", "pull config from the backend repo", or when the
  last-synced marker in .claude/upstream-sync.json is older than 7 days at the start
  of a session. It reviews what changed in the arkad repo (the gold-standard repo for
  cross-cutting conventions) and adapts relevant changes into this repository.
version: 0.1.0
argument-hint: "[check|sync]"
---

# Upstream Sync Skill

## Purpose

The arkad repository (`ironcapitaleu/arkad`, locally at `~/Projects/gold/arkad`) is the
**gold-standard repo** for cross-cutting conventions in this organization. Process
improvements land there first: Claude workflows, skills, PR/commit guidelines,
permission settings. This skill reviews what changed in arkad since the last sync and
adapts anything cross-cutting into this repository.

**Sync direction is one-way:** arkad → frontend. If something in this repo seems worth
upstreaming, flag it to the human — never edit the arkad repo from here.

## Cadence

- **Regularly, not constantly.** Target: about once a week (or when the human asks).
- At session start, if `.claude/upstream-sync.json` says `lastSyncedAt` is more than
  7 days ago, mention it once: "Upstream sync with arkad is N days old — want me to
  run /upstream-sync?" Do not block work on it; do not nag more than once per session.

## What Syncs (and How)

| Category | Files in arkad | Sync mode |
| --- | --- | --- |
| Claude CI workflows | `.github/workflows/claude.yaml` | **Adapt** — carry over fixes (action config, triggers, job conditions), keep frontend specifics (two-branch dev/main flow) |
| Shared skills | `.claude/skills/linear/`, `.claude/skills/pr-iterate/` | **Adapt** — carry over structural/process improvements, keep frontend-specific content (FRONTEND template, dev-branch targeting, propagation rules, AGENTS.md guideline links, frontend few-shot examples) |
| Repo-specific skills | `.claude/skills/state-*`, `xbrl-accounting`, `domain-concept`, etc. | **Skip** — Rust/backend-specific. But note *patterns* worth imitating (e.g., if arkad grows a scaffold skill pattern that would fit React components) |
| Permission settings | `.claude/settings.json` | **Adapt** — mirror the *shape* (read-only allowlist philosophy), swap cargo commands for this repo's equivalents (`npm run test:ci`, `npm run lint:check`, `npm run typing:check`, `npm run format:check`) |
| AGENTS.md | `AGENTS.md` | **Adapt selectively** — general sections (General Rules, Error Naming, Commit Guidelines, PR Creation, PR Review Guidelines, Deviations) tend to evolve in parallel; diff them for improvements. Rust-specific sections: skip, but consider whether the *idea* has a TypeScript analog worth proposing |
| PR template | `.github/pull_request_template.md` | **Adapt** — keep structure aligned |

## Procedure

### Step 1: Determine what changed upstream

Read `.claude/upstream-sync.json` for the last-synced arkad commit. Then:

```bash
git -C ~/Projects/gold/arkad fetch origin main 2>/dev/null || true
git -C ~/Projects/gold/arkad log <lastSyncedCommit>..origin/main --oneline -- \
  .github/workflows/ .claude/ AGENTS.md CLAUDE.md .github/pull_request_template.md
```

If the local clone is missing, use `gh api repos/ironcapitaleu/arkad/commits` instead.
If nothing relevant changed, update the marker's `lastSyncedAt` and stop — report
"already in sync".

### Step 2: Review each relevant commit

For each commit touching the synced categories, read the diff and classify:

- **Cross-cutting fix/improvement** → adapt it here (translate repo specifics)
- **Backend-specific** → skip, but record it in the sync report
- **Ambiguous** → ask the human with a one-line summary of what it does upstream

### Step 3: Apply adaptations

Make the changes on a dedicated branch (`chore/upstream-sync-<date>`), targeting `dev`
per this repo's branching strategy. Preserve this repo's deliberate divergences —
never blind-copy a file that has frontend adaptations. Known deliberate divergences:

- Linear skill: FRONTEND template with sitemap item, AGENTS.md guideline links
  (arkad links to Notion), frontend few-shot title examples
- pr-iterate skill: dev/main two-branch flow, Proactive Propagation section, PR target dev
- claude.yaml: any frontend-specific jobs

### Step 4: Update the marker and report

Write `.claude/upstream-sync.json`:

```json
{
  "upstream": "ironcapitaleu/arkad",
  "lastSyncedCommit": "<arkad main sha>",
  "lastSyncedAt": "<ISO date>"
}
```

Commit it with the adaptations. Report to the human: what was adapted, what was
skipped (and why), anything flagged as worth upstreaming to arkad.

## Critical Invariants

- One-way sync: never modify the arkad repo from this skill.
- Never blind-copy files that carry deliberate frontend divergences (see Step 3).
- All changes go through a PR into `dev` — never commit sync changes directly.
- Update `.claude/upstream-sync.json` in the same PR as the adaptations, so the marker
  never claims a sync that wasn't merged.
