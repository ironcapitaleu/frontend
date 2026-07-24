---
name: design
description: >
  Use when the user asks to "design a component", "design a page", "review the design",
  "check design conformance", "does this fit the design language", "make it feel right",
  or when building or changing any user-facing UI. Guides new UI through the design
  language (DESIGN.md) and the design → documentation → testing flow, and audits existing
  UI for design-language conformance.
version: 0.1.0
argument-hint: "[component-page-or-'review']"
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion, Agent]
---

# Design Skill

## Purpose

Be the **advocate of the design language**. Every piece of UI in this product either
strengthens or dilutes the character defined in `DESIGN.md` — timeless classics,
reinterpreted for a modern age. This skill guides new UI through that language and audits
existing UI against it, then carries the work through the full flow:

> **Design → Documentation → Testing.**
> Decide how it should look and feel (DESIGN.md) → demonstrate it in the living catalog
> (Storybook stories) → defend it against regression (unit + play + visual tests, TESTING.md).

A UI change that skips a step is unfinished: undesigned UI drifts off-language, undocumented
UI is invisible to the catalog and to review, untested UI regresses silently.

## Read First

`DESIGN.md` is the authority — read it before designing or reviewing. The essentials:

- **The dual mandate.** Two poles held in balance: the **classical** (Greek-temple mark,
  black-on-white, serif display, the virtues of traditional value investing) and the
  **modern** (fast, crisp, elegant, alive — precise motion, the accent spark). Never one at
  the expense of the other. Drifted classical reads as a legacy institution; drifted modern
  reads as a generic startup.
- **The operating rule.** Classical carries our **voice and values** (About, masthead,
  statements of principle → `font-classic`, serif, quiet surfaces). Modern carries our
  **product and machinery** (screener, search, controls → Inter, `font-monospace` numerals,
  precise motion, sparing accent). The two meet on every page — a serif title above a crisp,
  fast tool.
- **The mechanics.** Semantic tokens only (never raw hex/oklch — dark mode must keep
  working); the four font roles; the `65ch` justified reading column; hairline borders over
  shadows; `.btn-tactile` on buttons; height animated via `grid-template-rows` (`0fr`→`1fr`),
  never `display` toggles or `max-height`; motion restrained and purposeful, never decorative.

## Modes

### 1. Design — shape a new component or page

Before writing code, settle the design decisions (incrementally, don't overwhelm):

1. **What is it, and what is the user doing there?** — speaking-about-us moments lean
   classical; doing-work moments lean modern. Name which pole leads and where the other
   shows up (every screen should hold both).
2. **Typography** — which font role carries each level? Is this a `font-classic` moment
   (statement of principle) or working UI (Inter, mono numerals)?
3. **Color** — which semantic tokens? Where, if anywhere, does the accent spark appear?
   (The less it appears, the more it means.)
4. **Shape & elevation** — radius scale, hairline separation, shadows only if it floats.
5. **Motion** — what responds, and how? Follow the house conventions; motion must have a
   purpose (feedback, continuity), never decoration.
6. **Layout & responsiveness** — where does the layout genuinely change? Those breakpoints
   become story variants and test cases.
7. **Composition** — which existing `ui/*` primitives compose into this? (Reach for a
   primitive before restyling raw elements; if a new primitive is needed, use the
   `component-scaffold` skill.)

State the design back to the user in a few sentences before implementing. Then carry it
through the flow: build → stories for every meaningful state (see the `documentation`
skill) → tests per layer (see the `testing` skill).

### 2. Review — audit UI against the design language

For each component/page in scope, check:

**Character**
- Does it hold the dual mandate — timeless AND modern, trustworthy AND elegant? If it has
  drifted to one pole, name which and propose the rebalance.
- Is the classical/modern split applied by the operating rule (voice vs. machinery)?

**Mechanics**
- Semantic tokens only — flag any raw hex, raw `oklch()`, or non-token color
- Font roles used correctly — `font-classic` reserved for voice (not sprinkled on working
  UI, where it dilutes the classical moments); mono for numbers/tickers; running prose in
  the `65ch` justified column
- Radius from the `--radius` scale; separation by hairline `border` tokens; shadows only on
  genuinely floating surfaces
- Buttons carry `.btn-tactile`; height animation uses `grid-template-rows` — flag
  `max-height` tricks or `display` toggles even when they currently "work" (the wrong
  mechanism is what produces the subtle jump later)
- Accent used sparingly — flag accent creep
- Dark mode holds — both themes checked (Storybook theme toggle)
- Responsive — the layout holds at the component's breakpoints; no desktop-only design

**Flow completeness**
- Stories exist for the meaningful states (documentation half)
- Interactions have play tests; layout has viewport variants (testing half)

Report findings as a list: file, violation, suggested fix. Offer to apply.

### 3. Evolve — change the design language itself

When a change to the language is proposed (a new token, a new motion pattern, a shifted
principle):

1. Weigh it against the character: does it serve "timeless, modern, trustworthy, elegant,
   precise"?
2. Apply the token/pattern change in `src/index.css` (tokens are the single source of truth).
3. **Update `DESIGN.md` in the same pass** — this is DESIGN.md's own binding rule.
4. Demonstrate the change in the relevant stories, so the living catalog reflects it.
5. Propagate: search for existing UI that the change affects and update it — the language
   stays coherent only if it's applied everywhere.

## Proactive Behavior

- When building ANY user-facing UI — even when this skill wasn't explicitly invoked —
  apply the Design mode checklist silently and flag conflicts with DESIGN.md before
  implementing, not after.
- When touching a file that contains an existing design-language violation (raw color,
  wrong animation mechanism, missing `.btn-tactile`), fix it in passing or call it out.
- When a design decision emerges in conversation that DESIGN.md doesn't cover, propose
  capturing it (Evolve mode) rather than letting it live only in the code.

## Self-Improvement

After a session where the user corrected or refined a design judgement:

1. Ask: "Should this become part of DESIGN.md or this skill?"
2. Character/principle-level → `DESIGN.md`; operational checklist item → this skill.
3. Apply after user approval.

**DESIGN.md takes priority.** If this skill diverges from DESIGN.md, DESIGN.md wins — and
remember DESIGN.md itself is a living draft: when a decision serves the character better
than what's written, make it and update the doc in the same pass.
