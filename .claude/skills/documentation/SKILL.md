---
name: documentation
description: >
  Use when the user asks to "document", "add documentation", "add stories", "check docs",
  "review docs", "update the docs", or wants to improve documentation for any part of the
  frontend — JSDoc, Storybook stories, or the root documents (README.md, DESIGN.md, TESTING.md).
  Supports documenting a specific component, module, recently written code, or running a
  compliance check against the documentation conventions.
version: 0.1.0
argument-hint: "[target-path or 'check' or 'recent']"
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion, Agent]
---

# Documentation Skill

## Purpose

Guide documenting, checking, or refactoring frontend documentation. All written
documentation must comply with the guidelines in `DOCUMENTATION.md` at the project root —
read it before writing docs. On the frontend, documentation has **two halves that must
stay in step**:

1. **Written docs** — JSDoc on components/hooks/utilities, and the root documents
   (`README.md`, `DESIGN.md`, `TESTING.md`, `AGENTS.md`).
2. **Living documentation** — **Storybook is the living catalog of the design system.** A
   component's stories ARE its primary documentation: they show every meaningful state,
   render under both themes, generate autodocs, and double as interaction test cases
   (and as visual-regression cases once that layer is adopted — see TESTING.md §3).
   Documenting a component means giving it stories.

This skill operates in three modes:
1. **Write** — Add or improve documentation for a target (JSDoc + stories + doc sync)
2. **Check** — Audit for gaps and drift
3. **Improve guidelines** — When patterns emerge from user feedback, fold them into the conventions

## Entry Point

**Adaptive questionnaire** — only ask what you can't infer from the user's message.

When invoked, first parse the user's invocation message and conversation context for:
- **Mode** — write, check, refactor, or improve guidelines?
- **Scope** — a component, a directory, "recent" (git diff), or everything?
- **Half** — JSDoc, stories, root docs, or the full pass?

Then:
1. **State your understanding** back in one sentence (e.g. "I'll add stories and JSDoc for the
   components changed in the last commit.").
2. **Ask only for what's genuinely unclear** via `AskUserQuestion`.
3. On confirmation, proceed.

## Conventions

### JSDoc (Quick Reference)

These are loaded from `DOCUMENTATION.md` but summarized here for speed:

- Every **exported** item carries a JSDoc block stating the **contract**, not the implementation.
- **W-Fragen**: every doc answers *Was?* (summary line, always); *Warum?/Wie?/Wer?/Wann?/Wo?*
  when a reader would naturally ask.
- First line short, complete sentence, present tense, third person — it is the IDE tooltip
  and the autodocs preview.
- The component file's JSDoc is the API contract; the JSDoc above the story `meta` is the
  catalog intro. Keep them consistent. Include disambiguation from confusable neighbours
  ("For non-interactive status labels, use `Badge`").
- **Self-documenting signatures first** — rename a prop/parameter before documenting it; no
  `@param`/`@returns` noise. Document non-obvious props on the props type (renders in the
  Storybook controls table).
- **No `@example` blocks** — examples live in stories, which are rendered and play-tested.
- **Never name consumers** in a reusable component's docs; naming the external system an item
  serves (Supabase in `lib/supabase`) is fine.
- When unsure: look at documented siblings that already follow the conventions and match them.

### Stories (the living documentation)

- **Every reusable component ships a `*.stories.tsx`** — this is a design-language rule
  (DESIGN.md §6), not a nice-to-have. CSF3, `tags: ["autodocs"]`.
- First story is `Playground` with sensible defaults; then **one story per meaningful state**:
  each variant and size, disabled/error/empty/loading states, and viewport variants for
  layout-bearing components. A state without a story is undocumented and untested — story
  coverage is documentation coverage and test coverage at once.
- Story-level JSDoc explains what each story demonstrates (see the existing story files).
- Interactive stories get `play` tests (see the `testing` skill for the shape).
- Use the shared showcase decorators (`.storybook/utils/showcaseDecorators.tsx`) for
  variant/size grids instead of hand-rolling them.

### Root documents — sync rules

Docs drift is a review item. The binding rules:

- **`src/index.css` token change → update `DESIGN.md` in the same commit** (DESIGN.md's own
  rule; hold yourself to it).
- New feature or page → `README.md` feature overview, plus the sitemap page and sitemap XML
  (AGENTS.md § Documentation Consistency).
- New/changed testing pattern → `TESTING.md` (doctrine) or the `testing` skill (operational
  pattern).
- New/changed design pattern, motion convention, or component principle → `DESIGN.md`, and
  demonstrate it in a story.
- Behaviour or API change → cross-check README, inline examples, and stories for staleness.

## Execution

### For "Write" or "Refactor" mode:

1. Read `DOCUMENTATION.md` to load the current conventions; for design-language content also
   read `DESIGN.md`.
2. Read the target files.
3. For each component in scope:
   - Check JSDoc exists and states the contract; write/improve it.
   - Check stories exist for every meaningful state; add missing ones (match the existing
     story files' style — argTypes with descriptions, story-level JSDoc).
   - Check the sync rules — does this change ripple into README/DESIGN.md/sitemap?
4. Verify: `npm run typing:check`, `npm run lint:check`, and `npm run test:storybook` (stories
   must build and pass their play tests).

### For "Check" mode:

1. Read `DOCUMENTATION.md` to load conventions, then scan the target for violations.
   Check for:
   - Exported components/hooks/utilities without JSDoc, or without a proper summary line
   - `@example` blocks in JSDoc (examples belong in stories)
   - Consumer names in a reusable component's docs (coupling)
   - Non-obvious props left undocumented on the props type
   - Missing when-to-use / neighbour disambiguation on confusable `ui/` primitives
   - Hooks that don't document their returned surface or subscription/cleanup behaviour
   - Components without a story file, or with stories missing meaningful states
     (variants without a story, no disabled/error/empty state, no viewport variant for
     layout-bearing components)
   - Story files without `autodocs`, without a `Playground`, or with undocumented stories
   - JSDoc that describes implementation instead of contract, or that has drifted from behaviour
   - Token changes in `src/index.css` not reflected in `DESIGN.md`
   - New pages missing from the sitemap page / sitemap XML
   - README feature overview stale relative to actual features
2. Report findings as a list: file, gap, suggested fix.
3. Optionally apply fixes if the user agrees.

### For "Improve guidelines" mode:

When iteration with the user reaches a new convention:

1. Identify where it belongs — `DOCUMENTATION.md` (written-doc conventions), this skill
   (operational), `DESIGN.md` (design language), `TESTING.md` (test doctrine), or
   `AGENTS.md` (general).
2. Write it concisely with a concrete example matching the existing style.
3. Show the user the proposed change before applying.

## Proactive Propagation

When the user requests a documentation fix on a specific item:

1. **Apply the requested change** to the target.
2. **Immediately reason**: can this same gap exist elsewhere?
3. **Search proactively** for all similar occurrences (components without stories, exported
   items without JSDoc, stale examples).
4. **Apply the fix everywhere** it applies — the user should never need to say "fix it
   everywhere".
5. **Report** what was found and fixed.

If uncertain whether a match is truly the same gap, list it and ask rather than silently
skipping.

## Self-Improvement

After a documentation session where the user corrected or refined something:

1. Ask: "Should I capture this as a convention?"
2. If yes, propose the addition (here, or in the appropriate root doc) with a concrete example.
3. Apply after user approval.

Examples of things worth capturing:
- JSDoc phrasings the user corrected — capture the preferred wording as a convention
- Story patterns that proved valuable (decorators, argTypes descriptions, showcase layouts)
- New sync rules that emerged (a doc that had to be updated alongside a kind of change)
- Autodocs/story-organization conventions established through repeated corrections
- Few-shot examples that drifted from the actual story files — update them

Also periodically review: do the conventions and examples here still match the catalog and
the codebase? If not, update them. The examples are authoritative guidance — they must
reflect reality.

**DOCUMENTATION.md, AGENTS.md, DESIGN.md, and TESTING.md take priority.** If this skill
diverges from them, they win; resolve conflicts in their favor.

**Proactive divergence detection.** When working on documentation, if you suspect existing
JSDoc, stories, or root docs diverge from the conventions, fix them proactively without
waiting to be asked.

This keeps the skill growing from real usage rather than speculation.
