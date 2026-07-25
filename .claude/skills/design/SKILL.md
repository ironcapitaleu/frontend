---
name: design
description: >
  Use when the user asks to "design a component", "design a page", "review the design",
  "check design conformance", "does this fit the design language", "make it feel right",
  proposes a new design idea (especially one that may deviate from the current design
  philosophy), or when building or changing any user-facing UI. Guides new UI through the
  design language (DESIGN.md) and the design → documentation → testing flow, audits existing
  UI for conformance, and when a new idea deviates from DESIGN.md surfaces the conflict and
  the reconcile-or-evolve choice rather than silently complying or refusing.
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

## Handling a Deviation — reconcile or evolve

When a new idea **conflicts** with DESIGN.md — not merely something the language is silent
on (that is a gap: propose capturing it), but something the language argues against — do not
silently comply and do not silently refuse. Both are failures: silent compliance is how the
language dies by a thousand cuts; silent refusal is how it ossifies into a museum piece.
Surface the deviation as an explicit decision:

1. **Name the conflict precisely.** Point to the specific principle or token it breaks —
   "DESIGN.md §3 treats the accent as a sparing spark; this fills a whole panel with it",
   not a vague "this feels off". If you can't name what it deviates from, it may not be a
   deviation.
2. **Read the intent.** What is the idea trying to achieve? The goal is usually legitimate
   even when the execution breaks a rule — separate the two.
3. **Offer both roads, with a recommendation and the reasoning:**
   - **Reconcile** — how to reach the same goal *within* the language. Give concrete
     alternatives ("keep the emphasis, but carry it with weight and whitespace instead of a
     full accent fill"). This is the default when the language already has a good answer.
   - **Evolve** — if the idea genuinely serves the character ("timeless, modern, trustworthy,
     elegant, precise") *better* than the current rule, then the rule is the thing that's
     wrong. Route to **Evolve mode**: propose the DESIGN.md change, and on approval update
     the doc, demonstrate it in a story, and propagate.
4. **Let the user decide** when it's genuinely their call — use `AskUserQuestion`, leading
   with your recommendation. Never change DESIGN.md without approval; never ship the
   deviation without one either.

The test for reconcile-vs-evolve is always the **character, not the letter**: does the idea
make the product *more* timeless-and-modern, trustworthy-and-elegant — or is it drift dressed
up as an idea? Say which you think it is, and why.

## Proactive Behavior

- When building ANY user-facing UI — even when this skill wasn't explicitly invoked —
  apply the Design mode checklist silently and flag conflicts with DESIGN.md before
  implementing, not after.
- When touching a file that contains an existing design-language violation (raw color,
  wrong animation mechanism, missing `.btn-tactile`), fix it in passing or call it out.
- When a design decision emerges in conversation that DESIGN.md doesn't cover (a **gap**),
  propose capturing it (Evolve mode) rather than letting it live only in the code.
- When a new idea **conflicts** with DESIGN.md (a **deviation**), never implement it silently
  and never dismiss it silently — run the reconcile-or-evolve flow above and put the decision
  to the user with your recommendation.

## Self-Improvement

After a session where the user corrected or refined a design judgement:

1. Ask: "Should this become part of DESIGN.md or this skill?"
2. Character/principle-level → `DESIGN.md`; operational checklist item → this skill.
3. Apply after user approval.

Examples of things worth capturing:
- A rebalancing the user asked for (too classical / too modern) — capture what tipped it, as
  a named smell the Review mode checks for
- Token or utility usages the user corrected — add to the Mechanics checklist
- A new motion or layout pattern the user approved — capture it in DESIGN.md and demonstrate
  it in a story
- Pages or components the user holds up as reference ("more like this") — cite them in this
  skill as exemplars
- Design decisions that recur in conversation but live nowhere — propose them for DESIGN.md

Also periodically review: do the checklists and cited exemplars still match the product and
DESIGN.md? If not, update them. The examples are authoritative guidance — they must reflect
reality.

**DESIGN.md takes priority.** If this skill diverges from DESIGN.md, DESIGN.md wins — and
remember DESIGN.md itself is a living draft: when a decision serves the character better
than what's written, make it and update the doc in the same pass.

**Proactive divergence detection.** When working on UI, if you suspect existing screens or
components diverge from the design language, fix them in passing or flag them without
waiting to be asked (see Proactive Behavior above).

This keeps the skill growing from real usage rather than speculation.
