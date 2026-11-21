# ADR 0001: Delete Merged Branches with a Daily Workflow

| Field | Value |
| ----- | ----- |
| Status | Accepted by `@DeCa09` on 2026-11-21 ([ironcapitaleu/frontend#387](https://github.com/ironcapitaleu/frontend/pull/387)) |
| Date | 2026-11-21 |
| Deciders | `@DeCa09` |
| Ticket | None |

## Context

Merged branches pile up in this repository. On 2026-11-21 five merged branches waited for a
person to delete them, and each release added more. The owner wants a clean repository every
morning, with no cleanup to-dos.

Three facts limit the options:

- A Claude Code cloud session cannot delete a branch. `git push --delete` returns HTTP 403
  through the agent proxy, and the GitHub tools have no delete call. So no routine can delete.
- GitHub's "Automatically delete head branches" setting deletes the head branch of each merged
  PR. Every release PR has `dev` as its head, so the setting would delete `dev` (owner,
  2026-11-21).
- The routines `dependabot-review-and-merge`, `security-audit`, and `upstream-sync-and-release`,
  the `release` skill, and the `pr-iterate` skill all follow this choice: they list no branches
  and ask no one to delete them.

A "merged branch" here is a branch whose newest PR merged, and that still points at that PR's
head commit.

## Decision

1. **A GitHub Actions workflow deletes merged branches daily.** It is
   `.github/workflows/delete-merged-branches.yaml`. It runs at 04:17 UTC, after the nightly
   Dependabot routine and before the working day, with the repository token. Its header names the
   branches it keeps.
2. **The "Automatically delete head branches" setting stays off.** It would delete `dev`.
3. **No routine or skill lists branches or asks a person to delete them.**

## Options Considered

Checked on 2026-11-21 against `dev` at `030c7bb`.

| Option | Deletes without a person | Keeps `dev` | Needs a new secret |
| ------ | ------------------------ | ----------- | ------------------ |
| **A (chosen): daily workflow** | Yes | Yes, by name and as a protected branch | No, it uses the repository token |
| B: GitHub's auto-delete setting | Yes | No | No |
| C: a routine lists branches, a person deletes them | No | Yes | No |

- B deletes `dev` with each release.
- C puts a to-do in front of the owner after every release, which the owner rejected.

## Consequences

- No branch cleanup note reaches the owner.
- The workflow file changes only through a reviewed PR. The routines never edit workflows.
- If any call fails, for example because the token is read-only, the run ends red, so the
  failure shows in the Actions tab. A branch that fails every day keeps every run red until
  someone fixes the cause.
- A branch merged into a stacked parent counts as merged. Its content lives in the parent.

## Open Questions

- If GitHub adds a way to exempt `dev` from the auto-delete setting, option B gets simpler than
  A. That reopens the decision.

## Sources

- The owner's messages in the session of 2026-11-21: the setting deletes `dev`, and the morning
  must start clean.
- `.claude/skills/release/SKILL.md`, Step 9, on `dev` before this change: the HTTP 403 on branch
  deletion from a cloud session.
- `list_branches` on 2026-11-21: `main` and `dev` are protected branches.
- [ironcapitaleu/frontend#381](https://github.com/ironcapitaleu/frontend/pull/381): the list of
  five merged branches.
