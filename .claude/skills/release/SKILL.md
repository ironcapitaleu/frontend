---
name: release
description: >
  This skill should be used when the user asks to "cut a release", "release the frontend",
  "ship dev to main", "propagate dev to main", "promote dev to main", "do a release", or
  "release dev", AND proactively right after a feature or dependabot PR has been merged into
  `dev` (or after a `pr-iterate` cycle lands a PR on `dev`) — the moment accumulated `dev`
  work should be promoted to `main`. It runs the `dev → main` release: assess divergence,
  guard against reverting main-only config, generate a changelog, open the release PR, wait
  for checks, merge with a MERGE COMMIT (never squash), and verify the deploy.
version: 0.1.0
argument-hint: "[check|release]"
allowed-tools: [Read, Bash, AskUserQuestion]
---

# Release Skill (frontend `dev → main`)

## Purpose

This repo ships on a **two-branch flow**: feature and dependabot PRs land on `dev`, and a
**release** promotes the accumulated `dev` state to `main` (which deploys via Cloudflare
Pages). This skill runs that promotion **safely and repeatably**, encoding the failure modes
that are easy to hit by hand.

**Repo:** `ironcapitaleu/frontend` (locally `~/Projects/gold/frontend`). This skill is
frontend-specific — arkad is `main`-only and has no release step, so this never applies there.

## When to run

**Explicit** (slash command or free text): `/release`, "cut a release", "ship dev to main",
"propagate dev to main", "do a release".

**Proactive** — this is the primary trigger. Run (or offer to run) a release right after:
- a **feature PR** is merged into `dev` and CI on `dev` is green, or
- a batch of **dependabot PRs** is merged into `dev`, or
- a **`pr-iterate`** cycle lands its PR on `dev`.

This is the mechanized version of pr-iterate's *Proactive Propagation* step 2 (`dev → main`).
pr-iterate should hand off to this skill rather than opening the release PR ad hoc.

**When NOT to release — flag to the human instead of proceeding:**
- `dev` CI is red, or `dev` has untested / half-landed work from other in-flight PRs.
- A **release freeze** is in effect.
- The divergence includes a **main-only config change that `dev` lacks** (see the guard below) —
  releasing would revert it.

Modes: `check` = assess and report only (no PR, no merge). `release` (default) = full flow.

## Release model & invariants

- **Direction:** always `base: main` ← `head: dev`. Never the reverse in this skill.
- **Merge strategy: MERGE COMMIT, never squash.** A squash re-flattens `dev`'s commits into a
  single new commit on `main`; `main` and `dev` then immediately re-diverge (main has the squash,
  dev has the originals), and the next release shows spurious conflicts forever. A merge commit
  keeps the histories reconciled (`dev...main` → `behind_by: 0` afterwards). This is the single
  most important rule here.
- **Never force-push. Never commit directly to `main`.** All promotion goes through the release PR.
- Update nothing else in the release PR — it is purely a `dev → main` merge.

## Procedure

### Step 1 — Preflight & assess divergence

```bash
gh api repos/ironcapitaleu/frontend/compare/main...dev \
  --jq '"dev has "+(.ahead_by|tostring)+" commit(s) main lacks; status="+.status'
```

- If `dev` has **0** commits main lacks → nothing to release. Report "main is already up to
  date with dev" and stop.
- List the commits being promoted (this is the changelog source):

```bash
gh api repos/ironcapitaleu/frontend/compare/main...dev \
  --jq '.commits[] | "\(.sha[0:8]) [\(.author.login // .commit.author.name)] \(.commit.message|split("\n")[0])"'
```

Confirm `dev` is green (latest `dev` push CI succeeded):

```bash
gh run list --repo ironcapitaleu/frontend --branch dev --limit 5 \
  --json workflowName,event,status,conclusion,headSha
```

If `dev` is not green, stop and flag it.

### Step 2 — Diverged-config guard (the trap)

Detect **main-only changes that `dev` does not have** — releasing `dev → main` can silently
revert them. This is exactly how the OAuth `claude.yaml` auth fix nearly got reverted.

```bash
# Commits on main that dev lacks:
gh api repos/ironcapitaleu/frontend/compare/dev...main \
  --jq '"main has "+(.ahead_by|tostring)+" commit(s) dev lacks"; .commits[]?.commit.message|split("\n")[0]'
# Config/workflow files that differ between the tips:
for f in .github/workflows/claude.yaml .github/workflows/ci.yaml; do
  if diff <(gh api "repos/ironcapitaleu/frontend/contents/$f?ref=dev"  --jq .content | base64 -d) \
          <(gh api "repos/ironcapitaleu/frontend/contents/$f?ref=main" --jq .content | base64 -d) >/dev/null 2>&1; then
    echo "$f: identical"; else echo "$f: DIFFERS between dev and main ⚠"; fi
done
```

If a **workflow/config file differs** or main has commits `dev` lacks, do **not** proceed
blindly. Use `AskUserQuestion` to confirm: (a) the difference is intended to be overwritten by
this release, or (b) `dev` should first pick up the main-only change (a small PR into `dev`, à la
the auth fix), then release. Default to safety — pausing beats a silent revert.

### Step 3 — Changelog

From Step 1's commit list, group into: **Features / fixes**, **Dependencies** (dependabot),
**CI/tooling**. A few bullet points; reference PR numbers where the commit subject has `(#NN)`.

### Step 4 — Open the release PR

```bash
gh pr create --repo ironcapitaleu/frontend --base main --head dev \
  --title "release: propagate dev to main" \
  --body "<changelog from Step 3 + any guard notes from Step 2>"
```

Check it is mergeable (conflicts surface here):

```bash
gh pr view <N> --repo ironcapitaleu/frontend --json mergeable,mergeStateStatus
```

If `mergeable: CONFLICTING`, stop and report which files conflict — resolving a release conflict
is a human decision, not something to auto-resolve.

### Step 5 — Wait for checks

The release PR runs `ci`, `claude-auto-review`, `Enforce Merge Policy`, and `Cloudflare Pages`.
Poll simply until they settle — do **not** write a clever compound `until` condition:

```bash
gh pr view <N> --repo ironcapitaleu/frontend \
  --json mergeStateStatus,statusCheckRollup \
  --jq '{mergeState: .mergeStateStatus, checks: [.statusCheckRollup[]? | (.name // .context)+" = "+(.conclusion // .state // "pending")]}'
```

Repeat with a plain `sleep 15` between calls until `ci` and `claude-auto-review` are `SUCCESS`
and `mergeState` is `CLEAN`. If a check fails, stop and report it.

### Step 6 — Merge (MERGE COMMIT)

```bash
gh pr merge <N> --repo ironcapitaleu/frontend --merge
```

**Never `--squash`, never `--rebase`.** (See invariants.)

### Step 7 — Post-merge verify

```bash
gh api repos/ironcapitaleu/frontend/compare/dev...main --jq '"behind_by(main missing dev)="+(.behind_by|tostring)'
```

- Expect **`behind_by: 0`** — main now contains all of dev. If not, investigate before declaring done.
- Confirm the `main` **Cloudflare Pages** deploy kicked off / succeeded:
  ```bash
  gh run list --repo ironcapitaleu/frontend --branch main --limit 5 --json workflowName,status,conclusion
  ```
- **Back-merge check:** if `main` still has commits `dev` lacks (hotfixes committed straight to
  main, etc.), note it and offer a `main → dev` sync PR so the branches don't quietly re-diverge.

### Step 8 — Report

Summarize: what shipped (changelog), the merge commit SHA, `behind_by: 0` confirmation, deploy
status, and anything flagged (guard pauses, back-merge needed).

## Guardrails

- **Merge commit only** for `dev → main` — squash/rebase are bugs here.
- **Never** release over a main-only config change without explicit confirmation (Step 2).
- **Never** force-push or commit directly to `main`.
- Stop and ask on: red `dev` CI, merge conflicts, release freeze, or an ambiguous divergence.
- `check` mode never opens or merges anything.

## Integration with pr-iterate

`pr-iterate`'s *Proactive Propagation* (feature → `dev` → `main`) delegates its `dev → main`
leg here: once a PR lands on `dev` and `dev` is green, invoke this skill (default `release`
mode) rather than hand-rolling the release PR. This keeps the merge-commit rule and the
diverged-config guard in one place.

## Example

User: "I just merged the dependabot batch into dev — ship it."
→ Step 1: dev has 3 commits main lacks (deps bumps); dev CI green.
→ Step 2: guard — `claude.yaml`/`ci.yaml` identical on dev & main, no main-only commits. Clear.
→ Step 3: changelog — "Dependencies: setup-node, dev-deps (13), prod-deps (15)".
→ Step 4: open `release: propagate dev to main`, mergeable/CLEAN.
→ Step 5: wait — ci + auto-review SUCCESS.
→ Step 6: `gh pr merge --merge`.
→ Step 7: `behind_by: 0` ✅, Cloudflare Pages deploy triggered on main.
→ Step 8: "Released 3 dependency updates to main (merge `abc1234`), deploy in progress."
