# Iron Capital — Documentation Guidelines

This document defines the standards for writing frontend documentation. It tells
you **what** to document, **how** to structure it, and **where** examples live.
It is a companion to [AGENTS.md](./AGENTS.md) (general engineering guidelines),
[DESIGN.md](./DESIGN.md) (design language), and [TESTING.md](./TESTING.md)
(testing doctrine), and it mirrors the backend's `DOCUMENTATION.md` in
[`arkad`](https://github.com/ironcapitaleu/arkad) — same skeleton, same
principles, reinterpreted for TypeScript/React where the languages genuinely
differ.

Frontend documentation has two halves that must stay in step:

1. **Written docs** — JSDoc on every exported item, plus the root documents.
2. **Living documentation** — **Storybook is the rendered documentation
   surface.** What rustdoc pages are to the backend, the Storybook catalog is
   to us: the JSDoc above a story's `meta` renders as the component's docs
   intro, TSDoc on props surfaces in the controls table, and stories are the
   executable examples (see [Examples Live in Stories](#examples-live-in-stories)).

The document is organized as follows:

1. **General Principles** — the W-Fragen framework and documentable items overview
2. **Per-Item Sections** — components, props, hooks, contexts, utilities, variants, errors, constants
3. **Cross-Cutting Reference** — stories as examples, coupling rules, formatting, enforcement, checklist

---

## General Principles

- Every **exported** item **must** have a JSDoc comment.
- Documentation describes the **contract** (what it does, guarantees, and
  constraints), not the implementation.
- Write for a reader who understands React and TypeScript but is unfamiliar
  with this codebase.
- Keep the first line short and self-contained — IDE tooltips and Storybook
  autodocs use it as the preview.
- Use present tense, third person: "Renders the navigation bar", not "This
  will render..." or "Render the nav".
- Choose `a`/`an` by the **spoken sound**, not the first letter: "an SEC
  filing", "an `href`".
- Prefer clarity over terseness. A few extra words that remove ambiguity beat
  a tighter phrase that reads as jargon.
- When tightening documentation that is already good, **blend** rather than
  replace: keep the established, well-worded opening and enrich it.

### Documentable Items

| Item kind | Example | Doc placement |
|-----------|---------|---------------|
| Component | `function Button() {}` | `/** */` above the component |
| Props type | `interface ButtonProps` | `/** */` above the type + above each non-obvious member (surfaces in the Storybook controls table) |
| Hook | `function useAuth() {}` | `/** */` above |
| Context provider + consumer hook | `AuthProvider`, `useAuthContext` | `/** */` above each export |
| Utility function | `function cn() {}` | `/** */` above |
| CVA variants | `const buttonVariants = cva(...)` | `/** */` above the `cva` call |
| Error class | `class InvalidInput {}` | `/** */` above (wording rules below) |
| Constant / type alias | `const BUTTON_VARIANTS = [...]` | `/** */` above |
| Story `meta` | `const meta: Meta<typeof Button>` | `/** */` above — renders as the autodocs intro |
| Barrel re-export | `export { Button } from "./button"` | Not required (target item's doc is used) |

### The W-Fragen Principle

Every doc comment answers a subset of these questions, in this priority order:

| Question | Answers | Applicable items | Required? |
|----------|---------|------------------|-----------|
| **Was?** (What?) | What does this item do or represent? | All | Always — this is the summary line |
| **Warum?** (Why?) | Why does it exist? What problem does it solve? | Components, hooks, contexts, utilities | When the "what" alone doesn't justify the item's existence |
| **Wie?** (How?) | How does it achieve its purpose? | Hooks, utilities | When the mechanism is non-obvious from the signature/type |
| **Wer?** (Who?) | Who should use this — and when to use a neighbour instead? | Components (esp. `ui/` primitives) | When siblings could be confused (`Button` vs `Badge`) |
| **Wann?** (When?) | Under what conditions is this triggered / produced? | Callbacks, effects, error classes | Primarily for subscriptions and error conditions |
| **Wo?** (Where?) | Where does this fit in the system? | Contexts, design tokens | When the item's placement is non-obvious |

Not every item needs all questions answered. A simple prop needs only *Was?*.
A context provider may need most of them. The goal is that a reader never has
to guess the answer to a question they'd naturally ask.

### Comment Syntax

- API documentation uses `/** */` JSDoc directly above the item — never `//`
  line comments.
- No `@fileoverview` blocks: our rendered documentation surface is Storybook
  and the root documents, not per-file pages.

---

## Components

### W-Fragen

- **Was?** — What does it render? Always.
- **Wer?** — When should a consumer reach for it, and when for a neighbour?
  Required for `ui/` primitives with confusable siblings.
- **Warum?** — For app-level components whose existence isn't self-evident.

### Content Structure

1. **What-sentence** (required) — one line, complete sentence.
2. **When-to-use guidance** (for reusable components) — including
   **disambiguation from neighbours** where confusion is plausible.
3. The component file's JSDoc is the **API contract**; the JSDoc above the
   story `meta` is the **catalog intro** (usage guidance, links, caveats). They
   share the job — keep them consistent, not identical.

### Example

```tsx
/**
 * An interactive control used to trigger actions — primary, secondary,
 * destructive, and icon-only. For non-interactive status labels, use `Badge`.
 */
function Button({ ... }) { ... }
```

---

## Props

- **Self-documenting prop names first.** Rename a prop so its name and type
  carry the meaning before reaching for a doc comment — the TypeScript type
  already does most of what a `# Arguments` section does in Rust.
- Document the **non-obvious members** of the props type. TSDoc on a member
  surfaces in the Storybook controls table, so this is rendered documentation,
  not dead text.
- Do **not** document `className`, `children`, or spread `...props` — they are
  idiomatic and obvious.

### Example

```tsx
interface SearchBarProps {
  /** Called with the trimmed query when the user submits. Not called for empty input. */
  onSearch: (query: string) => void;
}
```

---

## Hooks

- **Was?** — what state/behaviour it provides; name the returned surface.
- **Wann?** — subscription and lifecycle behaviour: what it subscribes to,
  when it updates, that it cleans up on unmount.
- Fallibility: document what consumers see in failure states (e.g. `user`
  stays `null`), not internal error handling.

### Example

```ts
/**
 * Provides the current Supabase auth state and auth actions.
 *
 * Subscribes to auth changes on mount and unsubscribes on unmount;
 * `loading` is `true` until the initial session has been resolved.
 */
export function useAuth() { ... }
```

---

## Contexts

- The **provider** documents what world it provides to the subtree.
- The **consumer hook** documents its contract — including the error thrown
  when used outside the provider (that throw is part of the API):

```tsx
/**
 * Returns the auth context of the nearest `AuthProvider`.
 *
 * Throws when used outside an `AuthProvider` — every consumer must be
 * rendered inside one.
 */
export function useAuthContext() { ... }
```

---

## Utilities

One-liner for the *Was?*; add the *Wie?* only when the mechanism is the point:

```ts
/**
 * Merges class values into a single string, resolving Tailwind conflicts
 * so the last conflicting utility wins.
 */
export function cn(...inputs: ClassValue[]) { ... }
```

---

## CVA Variants

Document the `cva` call with a one-liner naming the axes; document individual
variants only when a name alone could mislead:

```ts
/** Style variants for `Button`: visual `variant` and text/icon `size` axes. */
const buttonVariants = cva(...);
```

---

## Error Classes

Wording follows the backend convention (see AGENTS.md § Error Naming):

- Error classes: start with **"Error representing..."** or **"Error indicating..."**
- Include the *Wann?* — the condition that produces it.

```ts
/** Error indicating that the ticker symbol failed validation before lookup. */
export class InvalidTickerSymbol extends Error { ... }
```

---

## Constants and Type Aliases

- One-liner *Was?*. For design-token-adjacent constants, add the *Wo?* —
  where the value comes from (e.g. "mirrors the `--radius` scale in
  `src/index.css`").

---

## What Not to Document

- **Non-exported items** — document only if the logic is subtle enough to warrant it.
- **Obvious props** — `className`, `children`, `...props`, and any member whose
  name and type say it all.
- **Barrel files** (`index.ts`) — re-exports carry the target's documentation.
- **Story args objects and test files** — the story name and test name are the
  documentation.
- **Standard implementations with no surprises** — a `default` export of a
  page component that just composes documented children needs only its
  what-sentence.

---

## Cross-Cutting Reference

### Examples Live in Stories

The backend's doc-tests are compiled and executed — they cannot rot. A code
block inside a JSDoc comment has no such guarantee, so **we do not write
`@example` blocks.** The executable example on the frontend is the **story**:
rendered in the catalog, exercised in both themes, verified by play tests.

- Usage worth demonstrating → add or extend a story (see the `documentation`
  skill for story conventions), and let the JSDoc point there in prose if
  needed ("see the `Playground` story").
- A component state that needs explaining is a story that is missing.

### Coupling Rules

- **Never name your consumers.** A `ui/` primitive's docs must not mention the
  pages or features that use it ("used by the StockScreener" rots the moment
  a second consumer appears). Describe what the item does, not who calls it.
- Naming the **external system** an item exists to serve is fine and
  encouraged where it is the item's domain: `lib/supabase` docs naturally speak
  about Supabase; `useAuth` naturally speaks about auth sessions.
- No sibling contrasts beyond deliberate disambiguation (the `Button` vs
  `Badge` pattern) — and disambiguation names the *alternative*, not a consumer.

### Links

- Use `{@link Target}` for cross-references that should resolve in IDEs, and
  backticked names (`` `Badge` ``) where a plain mention reads better.
  Use sparingly — a link per doc comment, not a link per sentence.

### Formatting

- The summary line is a complete sentence ending with a period.
- A blank `*` line separates the summary from elaboration paragraphs.
- Wrap identifiers, props, and values in backticks: `` `variant` ``, `` `null` ``.
- List items use `-` consistently.

### Enforcement

Documentation compliance is **review-enforced** — there is currently no
automated JSDoc lint in the toolchain (Biome does not check doc comments).
Concretely:

- PR review checks docs against this document (AGENTS.md § Style & Documentation
  and § Documentation Consistency).
- The `documentation` skill's **Check mode** audits a target against these
  guidelines on demand.
- Storybook builds and `npm run test:storybook` verify that the living half —
  stories and their play tests — compiles and passes.

If an automated doc lint is ever adopted, it will be spiked and added to CI
deliberately, like any tool.

---

## Checklist for New Code

Before submitting a PR, verify:

- [ ] Every exported item has a JSDoc comment with a summary line.
- [ ] Component docs state when to use the component — with disambiguation from
      confusable neighbours where relevant.
- [ ] Non-obvious props are documented on the props type (they render in the
      Storybook controls table).
- [ ] Hooks document their returned surface and subscription/cleanup behaviour.
- [ ] No `@example` blocks — usage is demonstrated in stories instead.
- [ ] No consumer names in reusable components' docs.
- [ ] The story `meta` has a JSDoc intro; each story has a doc line.
- [ ] Each doc comment answers the relevant W-Fragen (at minimum *Was?*).
