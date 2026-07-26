---
name: component-scaffold
description: >
  Use when the user asks to "create a component", "scaffold a component", "add a new UI component",
  "generate component boilerplate", or wants to create a new reusable component with all its
  associated files (implementation, tests, stories, barrel export). Also use when the user says
  "new component" or gives a component name and expects the full file set to be generated.
version: 0.1.0
argument-hint: "[component-name] [description of what it does]"
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion]
---

# Component Scaffold Skill

## Purpose

Generate the full file set for a new reusable UI component following this project's conventions.
Ensures consistency across the codebase: every component gets the same structure, naming,
testing patterns, and Storybook stories from day one.

## When to Use

- Creating a new reusable UI component (lives in `src/components/ui/`)
- Creating a new app-level component that should follow the folder convention
- Adding missing files to an existing component (e.g., adding stories or tests to a component that lacks them)

## File Set Generated

For a UI component named `{name}` (kebab-case):

```
src/components/ui/{name}/
├── {name}.tsx              # Component implementation
├── {name}.test.tsx         # Unit tests
├── {name}.stories.tsx      # Storybook stories
├── variants.ts             # CVA variants (if component has multiple visual variants)
└── index.ts                # Barrel export
```

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Folder name | kebab-case | `date-picker/` |
| Component file | kebab-case.tsx | `date-picker.tsx` |
| Test file | kebab-case.test.tsx | `date-picker.test.tsx` |
| Story file | kebab-case.stories.tsx | `date-picker.stories.tsx` |
| Variants file | `variants.ts` (always) | `variants.ts` |
| Barrel export | `index.ts` (always) | `index.ts` |
| Component name (in code) | PascalCase | `DatePicker` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-2"` |

## Templates

### Component (`{name}.tsx`)

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * {Description of what the component does.}
 */
function {PascalName}({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="{name}"
      className={cn("", className)}
      {...props}
    />
  );
}

export { {PascalName} };
```

**Key conventions:**
- Named export (never default export)
- Function declaration (not arrow function)
- `data-slot="{name}"` on root element
- Accept `className` prop, merge via `cn()`
- Spread remaining `...props`
- JSDoc comment describing purpose — follow `DOCUMENTATION.md` (summary line answering *Was?*
  always, plus *Warum?/Wer?* when non-obvious — e.g. when-to-use with neighbour disambiguation
  for `ui/` primitives; no `@example` blocks)
- Base element type in `React.ComponentProps<"...">` matches the root HTML element

### Variants (`variants.ts`) — only when needed

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const {camelName}Variants = cva("inline-flex items-center justify-center", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      outline: "border border-input bg-background",
    },
    size: {
      default: "h-10 px-4",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type {PascalName}Variants = VariantProps<typeof {camelName}Variants>;

export { {camelName}Variants, type {PascalName}Variants };
```

### Test (`{name}.test.tsx`)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { {PascalName} } from ".";

describe("{PascalName}", () => {
  it("should render its content when mounted", () => {
    render(<{PascalName}>Content</{PascalName}>);

    const expectedResult = "Content";

    const result = screen.getByText("Content").textContent;

    expect(result).toBe(expectedResult);
  });

  it("should merge a custom class when className is provided", () => {
    render(<{PascalName} className="custom-class">Content</{PascalName}>);

    const expectedResult = true;

    const result = screen.getByText("Content").className.includes("custom-class");

    expect(result).toBe(expectedResult);
  });
});
```

**Test conventions** (full doctrine in `TESTING.md`; operational patterns in the `testing` skill):
- Import from barrel (`"."`), not from the file directly
- `describe("{PascalName}", () => { ... })`
- `it("should ... when ...", () => { ... })` naming
- Arrange, Define (`expectedResult`), Act (`result`), Assert — blank lines between phases, no phase-label comments
- Exactly ONE `expect()` per test — composite outcomes as a single structured object
- Use `userEvent.setup()` for interaction tests; `await` every interaction
- Use `screen` queries (prefer `getByRole`, `getByLabelText`; `getByTestId` last resort)

### Story (`{name}.stories.tsx`)

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { {PascalName} } from ".";

const meta: Meta<typeof {PascalName}> = {
  title: "Components/{PascalName}",
  component: {PascalName},
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof {PascalName}>;

export const Playground: Story = {
  args: {
    children: "Content",
  },
};
```

**Story conventions** (stories are the living documentation — see the `documentation` skill):
- CSF3 format
- Import `Meta` and `StoryObj` from `@storybook/react-vite`
- `tags: ["autodocs"]` for auto-generated docs
- `title: "Components/{PascalName}"` (matches every existing story in the catalog)
- JSDoc above `meta` (renders as the autodocs intro) and above each story
- First story is always `Playground` with sensible defaults
- Add variant stories when component has variants (one per variant); use the shared
  showcase decorators (`.storybook/utils/showcaseDecorators.tsx`) for variant/size grids
- Add interaction tests via `play` function for stateful components — same AADA shape,
  one composite assertion (see the `testing` skill)
- Add viewport-variant stories for layout-bearing components (at the component's own breakpoints)

### Barrel Export (`index.ts`)

```tsx
export { {PascalName} } from "./{name}";
```

If variants exist:

```tsx
export { {PascalName} } from "./{name}";
export { {camelName}Variants, type {PascalName}Variants } from "./variants";
```

## Workflow

### Step 1: Gather Requirements

If the user provides a name only, ask:
1. **What does this component do?** (for JSDoc + story description)
2. **Does it have variants?** (visual styles like primary/secondary, sizes like sm/md/lg)
3. **What's the root HTML element?** (div, button, input, etc.)
4. **Is it interactive?** (needs event handlers, state)

If the user provides enough context (e.g., "create a badge component with variants for success, warning, error"), skip questions and infer.

### Step 2: Generate Files

Create all files following the templates above. Adapt based on:
- Root element type → changes `React.ComponentProps<"...">` and the JSX element
- Variants → adds `variants.ts`, updates component to accept variant props
- Interactive → adds state, event handlers, play functions in stories
- Children vs self-closing → adjusts props type and rendering

### Step 3: Verify

After generating:
1. Run `npm run typing:check` to verify no type errors
2. Run `npm run test:ci` to verify tests pass
3. Run `npm run lint:check` to verify formatting/linting

Report any issues and fix them.

### Step 4: Suggest Next Steps

After scaffolding:
- "Component scaffolded. Run `npm run storybook` to see it in the browser."
- If it's part of a larger feature, suggest what to do next.

## Decisions

### When to create `variants.ts`

Create it when the component has **2+ visual variants** (e.g., button with
primary/secondary/ghost) or **2+ sizes**. Do NOT create it for:
- Components with only one look (separator, label)
- Components where the visual changes come from the consumer's `className`

### UI vs App-level

- **UI component** (`src/components/ui/`): Reusable, generic, no business logic, could exist
  in any project. Examples: Button, Card, Input, Badge, Dialog.
- **App-level component** (`src/components/`): Specific to this application, may contain
  business logic or app-specific composition. Examples: Header, NavBar, StockScreenerTable.

This skill scaffolds **UI components** by default. For app-level components, adjust the
path and potentially skip the story if it's too app-specific to demo in isolation.

## Self-Improvement

After scaffolding a component where the user corrects or refines the output:

1. Ask: "Should I update the component-scaffold skill with this change?"
2. If yes, update the relevant template or convention.
3. Apply after user approval.

Examples worth capturing:
- New base patterns that emerge (e.g., compound components, context-based components)
- Story patterns that work well (decorators, play functions)
- Test patterns for specific component types (forms, modals, async)
- Changes to the file set (e.g., if the team adds `.css` files or co-located types)

**When and how to keep the templates current.** Tie the review to *use*, not a calendar —
it's more reliable than a cadence nobody watches:

- **On every invocation**, before generating, sanity-check the templates against one real,
  recently-touched component of the same kind (open an actual `ui/` sibling). If the codebase
  has moved on — a new convention, a changed story title, a different test shape — update the
  template first, then scaffold. This makes drift self-correcting at exactly the moment it
  would otherwise be copied forward.
- **On a correction**, apply the ask-capture-apply loop above.

(If the team ever wants an explicit freshness signal rather than use-triggered review, add a
`last-reviewed:` date to this skill's frontmatter and treat anything older than a chosen window
as due for a pass — but that's a heavier process to adopt deliberately, not a default.) The
templates are authoritative guidance — they must reflect reality.

**AGENTS.md, DOCUMENTATION.md, TESTING.md, and DESIGN.md take priority.** If a template
diverges from them, they win; resolve conflicts in their favor.

**Proactive divergence detection.** When scaffolding near existing components that diverge
from the templates (missing stories, off-convention tests), flag or fix them proactively
without waiting to be asked.

This keeps the skill growing from real usage rather than speculation.
