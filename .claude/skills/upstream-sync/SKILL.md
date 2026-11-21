---
name: upstream-sync
description: >
  This skill should be used when the user asks to "sync with arkad", "sync upstream",
  "check the gold standard repo", "pull config from the backend repo", or when the
  last-synced marker in .claude/upstream-sync.json is older than 7 days at the start
  of a session. It reviews what changed in the arkad repo (the gold-standard repo for
  cross-cutting conventions) and adapts relevant changes into this repository.
version: 0.2.0
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
| Process skills | Every skill in `.claude/skills/` that says how agents or people work, whatever the language: today `linear`, `pr-iterate`, `steward`, `handoff`, `epic`, `plain-english`, `adr`, `routine`, `testing`, `documentation` | **Adapt** — carry over each change. Port a new process skill that arkad adds in its own PR, which waits for the owner (Step 2). Keep frontend-specific content (see Step 3). Never sync `.claude/routines/`: each repository holds its own routine prompts |
| Domain skills | Skills about Rust, the state machine, or the data domain: `state-*`, `transition-*`, `domain-concept`, `xbrl-standardization`, `accounting`, `performance` | **Skip** — Rust/backend-specific. But note *patterns* worth imitating (e.g., if arkad grows a scaffold skill pattern that would fit React components) |
| Permission settings | `.claude/settings.json` | **Adapt** — mirror the *shape* (read-only allowlist philosophy), swap cargo commands for this repo's equivalents (`npm run test:ci`, `npm run lint:check`, `npm run typing:check`, `npm run format:check`) |
| AGENTS.md | `AGENTS.md` | **Adapt selectively** — general sections (General Rules, Architecture Decision Records, Writing Style, Error Naming, Commit Guidelines, Branching & PR Size, PR Creation, PR Review Guidelines, Skills, Routines, Deviations) tend to evolve in parallel; diff them for improvements, and port a new general section. Rust-specific sections: skip, but consider whether the *idea* has a TypeScript analog worth proposing |
| PR template | `.github/pull_request_template.md` | **Adapt** — keep structure aligned |

## Procedure

### Step 1: Determine what changed upstream

Read `.claude/upstream-sync.json` for the last-synced arkad commit. Then:

```bash
git -C ~/Projects/gold/arkad fetch origin main 2>/dev/null || true
git -C ~/Projects/gold/arkad log <lastSyncedCommit>..origin/main --oneline -- \
  .github/workflows/ .claude/ AGENTS.md .github/pull_request_template.md
```

If the local clone is missing, use `gh api repos/ironcapitaleu/arkad/commits` instead.

Then compare the process skills in arkad's `.claude/skills/` and the general sections of its
`AGENTS.md` with this repository. Each one missing here is a new item for Step 2, even if no
commit since the marker touched it. A section counts as present when this repository covers its
rules under any heading. A section this repository covers in part is a missing item too.

If an open `chore/upstream-port-*` PR already ports an item, do not open a second one. Push each
new arkad commit for that item to the port PR branch, and name the commit in the sync report. If
a closed, unmerged port PR ported an item, the owner declined the rules in that PR. Skip those
rules. A rule that arkad adds after the close is a new item. The owner reopens the PR to ask for
the declined rules again.

If nothing relevant changed and nothing is missing, update the marker's `lastSyncedAt` and
stop — report "already in sync".

### Step 2: Review each relevant commit

For each relevant commit, and each missing item from Step 1, read the diff and classify:

- **Cross-cutting fix/improvement to existing text** → adapt it here (translate repo specifics)
- **New process skill, new general `AGENTS.md` section, or new rule** → port it in its own PR
  into `dev`, on a branch `chore/upstream-port-<name>`, where `<name>` is the skill folder name
  or the section heading in kebab case (`branching-pr-size`). Add the `needs-human` label,
  and hand it off. The owner approves by removing the label. Never merge a port PR that carries `needs-human`, and never
  remove the label from a port PR yourself. For a section this repository covers in part, port
  only the missing rules, into the section that holds the topic, in the same kind of port PR. A
  new skill or rule can change how agents merge or release, so a person reads it first. The sync
  PR carries the other items and merges as usual, so a new item never holds back a clear one. A new
  rule in a section this repository has is a new rule too. A change to the text of a rule or
  skill this repository already has needs no approval
- **Unnamed skill** → the skills the table names keep their row. For a skill the table does not
  name, ask: does it still apply if the code were TypeScript? If yes, it is a process skill
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
- testing and documentation skills: the frontend versions cover React, stories, and
  TypeScript docs. Carry over only changes to the process, such as review passes or test naming
- routine skill: the example header names the frontend repository and the `Default`
  environment

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
