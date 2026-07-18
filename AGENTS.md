# Development Guidelines for This JavaScript/TypeScript Project

---

## General Rules (For All Code)

### Code Quality

- The code is **properly formatted** (`npm run format:check`).
- Dependencies must be **free of known security vulnerabilities** (`npm run security:check`).
- Code **compiles without errors** and passes:
  - Linting (`npm run lint:check`)
  - Unit tests (`npm run test:ci`)
  - Integration tests
  - Type checking (`npm run typing:check`)

### Pre-Push Verification

Before pushing a completed section of work (and especially before creating a PR), **run the full CI check suite locally** to catch failures early. Do not push code and rely on CI to find issues — verify locally first.

Run, at minimum:

```bash
npm run format:check
npm run security:check
npm run lint:check
npm run typing:check
npm run build
npm run test:ci
```

If any of these fail, fix the issue before pushing. This avoids the cycle of: push → CI fails → iterate → force-push → re-run CI.

**When to run:** After completing a logical unit of work (a feature, a refactor, a bug fix) — not after every single file save. Use judgement: a one-line typo fix doesn't need the full suite, but any change touching logic, dependencies, or configuration does.

### Codebase-Wide Propagation

When making a change that applies to multiple places (renaming a pattern, replacing a dependency,
migrating an endpoint, fixing a convention), proactively **apply it everywhere in the same pass**. Do not fix
one file and leave identical occurrences in other files for a follow-up PR. Search the entire
codebase for all instances before considering the change complete.

### Documentation

- Public items in libraries **must include JSDoc comments** (`/** */`).
- All implementation changes must be **reflected in documentation**, including:
  - JSDoc comments
  - Design documents (if applicable, e.g., mermaid diagrams)
- **Documentation must be version controlled**.

## Import Order Conventions

To ensure readability and consistency, all imports in this project must be grouped and ordered as follows:

1. **Standard Library Imports**  
   All imports from `Node.js` `built-in`s or standard libraries (e.g., `fs`, `path`, `crypto`) should appear first. (Less common in browser-focused projects like this one.)

2. **External Package Imports**  
   Imports from third-party packages (e.g., `react`, `vitest`, `@supabase/supabase-js`) should follow, grouped together.

3. **Internal Module Imports**  
   Imports from within this project (e.g., `./components/Header`, `../hooks/useAuth`) should come last.

Within each group, order imports alphabetically by module name. Separate each group with a single blank line for clarity. Prefer named imports over default where it improves clarity.

After the final line of imports, other top-level declarations (e.g., `constants`, `types`) can follow.

**Example:**

```javascript
import crypto from 'crypto';
import fs from 'fs';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { Header } from './components/Header';
import { useAuth } from '../hooks/useAuth';
```

---

## Error Naming Conventions

### Error Classes

Error class names should follow consistent naming patterns based on the kind of error they represent:

**Adjective-First Pattern** (for describing the *state* of something):

- Use when the error represents an invalid or unexpected *quality* of data or state
- Format: `[Adjective][Noun]`
- Common adjectives: `Invalid`, `Missing`, `Unexpected`, `Unauthorized`
- Examples: `InvalidInput`, `MissingData`, `UnexpectedResponse`

**Failed-First Pattern** (for describing *failed actions*):

- Use when the error represents a specific action or operation that failed
- Format: `Failed[Action/Noun]`
- Examples: `FailedClientCreation`, `FailedRequestExecution`, `FailedOutputComputation`
- Avoid: `[Action]Failed`

**General Guidelines:**

- Keep error names concise but descriptive
- The error class name should clearly indicate what went wrong
- Be consistent within the same error domain or module
- Prefer specific names over generic ones (e.g., `FailedClientCreation` over `CreationError`)
- Consider using error codes or properties for programmatic handling.

---

## Library Code

### Testing

- Write a **comprehensive unit test suite** for the implemented code.
- If applicable, write **integration tests**.
- Use **pretty assertions** (built-in with Vitest/Jest for readable diffs, or via libraries like `chai` with plugins) for improved readability.
- Unit tests should follow a modified version of the  **"Arrange, Act, Assert"** pattern, that we call the **"Arrange, Define, Act, Assert"** pattern:
  - **Arrange**: Set up the test environment (create any necessary objects, mimic dependencies, etc.)
  - **Define**: Define the expected result (usually in a variable called `expectedResult`)
  - **Act**: Execute the code under test and capture the result (usually in a variable called `result`)
  - **Assert**: Verify the results (i.e., that the `result` matches the `expectedResult`)
    - **Note**: `expect(...).toEqual()` for deep equality, `expect(...).toBe()` for strict equality, as well as `expect(...).toBeTruthy()` and `expect(...).toBeFalsy()` for boolean checks.
    - **IMPORTANT**: Key rule: write **EXACTLY ONE** `expect(...)` assertion per test function to ensure clarity on what is being tested.
- Unit tests should be placed in a file alongside the code they test, using the naming convention `[filename].test.ts` (e.g., `useAuth.test.ts` for `useAuth.ts`).
- Unit tests should follow the `should ... when ...`naming convention for **test descriptions** (not functions!!) (i.e., the string passed to `it()` or `test()`).
  - **Note**: Test names should be descriptive and start with `should`. Test names can be verbose, explicit but clear naming is favored over brevity.
  - **Example**: `it('should return null when user is not authenticated', ...)` — the string `'should return null when user is not authenticated'` is the **test name/description**.
- Integration tests should be placed in the `tests` directory, with each test in its own file.

---

### Logging

- Use **structured logging** in application code only (not in libraries).
- Logs must:
  - Be formatted as **JSON**
  - **Avoid sensitive data** (e.g., passwords, API keys, Personally Identifiable Information (PII))
  - Include **specific fields** (see format below)
  - Use the correct **log level**:
    - `info`: Regular application state (e.g., "Server started", "User logged in")
    - `debug`: Development-level details (e.g., variable values, request/response payloads)
    - `warn`: Unexpected but non-breaking situations (e.g., deprecated API usage, retries)
    - `error`: Critical issues (e.g., failure to connect to a database, unhandled exceptions)
- For browser-based React apps, use `console.log`, `console.warn`, `console.error`, etc., or a lightweight logging library like `loglevel`.
- For Node.js backends or SSR, consider libraries like `pino` or `winston` for structured JSON logging.

### Structured Logging Format

All structured logs must be formatted as **JSON documents** with exactly **five required fields**:

- **`level`**: Log severity level
  - Valid values: `info`, `debug`, `warn`, `error`
- **`timestamp`**: When the event occurred
  - Format: **ISO 8601 UTC** (e.g., `2024-10-12T14:30:00Z`)
- **`event`**: The specific event that triggered log creation
  - Brief, descriptive identifier for the event type
  - Use `snake_case` singular nouns (e.g., `user_login` instead of `user_logins`)
  - A set of predefined event names should be maintained and used consistently - likely maintained using a TypeScript `enum` or a union type for type safety
- **`message`**: High-level information about the `event`
  - Human-readable summary of what happened
  - free text string explaining the `event`
- **`context`**: Detailed contextual information
  - Nested field that can contain arbitrary key-value pairs
  - Additional state information needed to understand the event
  - Include relevant variables, IDs, or environmental details

**Example:**

```json
{
  "level": "info",
  "timestamp": "2024-10-12T14:30:00Z",
  "event": "user_authentication_success",
  "message": "User successfully authenticated",
  "context": {
    "user_id": "12345",
    "session_id": "abc-xyz-789",
    "ip_address": "192.168.1.100"
  }
}
```

---

### Sitemap

When adding / modifying pages in the frontend, make sure to update the sitemap page (`src/pages/SitemapPage.tsx`) and the sitemap XML file (`public/sitemap.xml`) accordingly. This is important for SEO and for users to easily navigate the site.

---

## Pull Request Creation

When creating a pull request, always use the repository's PR template located at
`.github/pull_request_template.md`. Fill in all sections:

1. **Description** — what changed and why
2. **Related** — link to tickets, issues, or prior PRs
3. **Type of change** — check the appropriate box
4. **Test Plan** — how was this tested, how can a reviewer verify
5. **Checklist** — confirm guidelines are followed

Never use a freeform PR body or a different structure.

---

## PR Review Guidelines

### Code Quality Review

- Readability and maintainability  
- Flag duplicated code  
- Ensure functions are focused and not overly long
- Make sure components, hooks, and functions follow the single responsibility principle
- Avoid side effects in functions (prefer pure functions where possible)
- Naming of variables, components, hooks, and functions must follow **Ottinger's Naming Rules** ([what they are](https://objectmentor.com/resources/articles/naming.htm)) (names should reveal intent, be pronounceable, avoid encodings, not be too cute, etc.)  
- Code within files and modules must follow the **Step-Down Rule** ([see explanation](https://dzone.com/articles/the-stepdown-rule)) (functions stay on one layer of abstraction, inside a module order functions by higher-level concepts first, details later)

### Performance

- Flag inefficiencies (e.g., unnecessary re-renders, missing `useMemo`/`useCallback`)
- Avoid premature optimization  

### Correctness & Safety

- Spot potential bugs and edge cases  
- Verify sufficient error handling  (e.g., `try/catch`, error boundaries, etc.)
- Ensure async code handles rejections properly (e.g., `await`, `.catch()`)

### Security

- Identify insecure practices (e.g., hardcoded secrets like exposed API keys)  
- Flag outdated or vulnerable libraries (`npm run security:check`)
- Avoid `dangerouslySetInnerHTML` or similar unsafe patterns in React components without sanitization

### Style & Documentation

- Ensure style conventions are followed  
- Check for meaningful comments and JSDoc  
- Suggest clearer names and documentation where needed  

### Documentation Consistency

- Cross-check code changes against `README.md`, API docs, usage guides, and inline examples  
- Flag when function names, parameters, or behaviors change but docs are not updated  
- Highlight outdated instructions or examples caused by code changes  
- Ensure new features or breaking changes are properly documented  
- Make sure that any new added pages are included in the sitemap page and sitemap XML file

### Testing Review

- Confirm sufficient test coverage  
- Suggest missing edge cases or error condition tests
- Ensure React components have appropriate tests (e.g., rendering, props, state changes)  
- Verify tests follow the **"Arrange, Define, Act, Assert"** pattern

### What NOT to Do

- Avoid nitpicks on trivial formatting  
- Do not suggest unnecessary rewrites if code is clear and correct  
- Do not enforce rules not listed in these guidelines  

---

## Commit Guidelines

All commits must follow the following format:

```sh
<type>[<scope>]: <short summary>

[<commit body>]

[<footer>]
```

### Commit Types

- **`feat`**: Adds new functionality to code by adding functions or features
- **`fix`**: Restores intended functionality by fixing bugs (including linting errors) - does not intentionally add new functionality
- **`refactor`**: Improves existing code without adding functionality by, for example:
  - Simplifying code structure
  - Improving readability
  - Improving performance (time/space)
  - Reducing dependencies
  - etc.
- **`style`**: A specific type of refactoring. Formatting, indentation, or code style changes (no logic changes)
- **`perf`**: A specific type of refactoring. Performance-focused refactoring without changing external behavior
- **`test`**: Adds or modifies automated tests (specifications for expected behavior)
- **`docs`**: Changes only to software documentation. Usually in the form of JSDoc comments, or markdown files (design docs, README, etc.)
- **`ci`**: **Direct** changes to Continuous Integration pipeline configuration
- **`cd`**: **Direct** changes to Continuous Deployment pipeline configuration
- **`build`**: Changes affecting build system or dependencies. Changes to resulting build output, i.e., the bundle. (e.g., updating/ adding a new library dependency, changing the Vite/ TypeScript config). Usually in `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`.
- **`revert`**: Reverts a previous commit
- **`chore`**: Catchall commit type. For routine maintenance tasks not affecting app logic, CI/CD, or build output (e.g., updating files such as `.gitignore`, LICENSE files, generic project management templates, or updating automation scripts like `Makefile` files or similar.)

### Scope (Optional)

Add scope for area-specific changes when it helps understanding:

- Package names
- Service or module names
- Component areas

**Examples:**

- `feat(auth): add user login validation`
- `fix(database): handle connection timeout errors`

### Short Summary

- Use **imperative mood** ("add", not "added" or "adds")
- Keep under **72 characters**
- Be descriptive but concise

### Commit Body (Optional)

- Explain **why** the change was made, not what it does
- Use when additional context is needed
- Separate from summary with blank line

### Footer (Optional)

- Reference issues or breaking changes
- Use when relevant for context

**Example Commit:**

```sh
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

---

## Deviations

If you must deviate from any guideline, **include a code comment** explaining why. Consistency, safety, and clarity are the priorities in this project.

---

## JavaScript/TypeScript Guidelines

Some general guidelines to follow when writing JavaScript/TypeScript code in this project. Some of these (as well as rules that are not listed here) are enforced via linters or formatters, but it's good to gather some important ones in one place for reference.

### Variable Declaration

- General rule for variable declarations:
  - Use `const` by default
  - Use `let` when you need to reassign
  - Avoid `var` in modern JavaScript
- **Declare Objects with `const`**: Declaring objects with const will prevent any accidental change of type.
- **Declare Arrays with `const`**: Declaring arrays with const will prevent any accidental change of type.

### Variable Initialization

- **Initialize Variables**: Always initialize variables when declaring them.
- **Don't use `new Object()`**:
  - Use `""` instead of `new String()`
  - Use `0` instead of `new Number()`
  - Use `false` instead of `new Boolean()`
  - Use `{}` instead of `new Object()`
  - Use `[]` instead of `new Array()`
  - Use `function (){}` instead of `new Function()`

### TypeScript-Specific Guidelines

- Use TypeScript's type system effectively: prefer interfaces and types for complex structures, use unions and intersections as needed.
- Avoid using `any` type unless absolutely necessary; prefer more specific types.
- Use `unknown` instead of `any` when the type is not known
- Enable strict mode in `tsconfig.json` (`"strict": true`)
- Use `readonly` for properties that should not be modified after initialization
- Prefer `interface` over `type` for defining object shapes, unless using advanced type features

### Miscellaneous

- Use **arrow functions** for anonymous functions and callbacks
- Prefer **template literals** (`` `Hello, ${name}!` ``) over string
  concatenation (`'Hello, ' + name + '!'`)
- Avoid global variables, avoid `new`, avoid `==`, avoid `eval()`
- Always declare `local variables`
- Use **async/await** for asynchronous code instead of Promises directly
- **Declarations on Top**: Put all declarations at the top of each script or function.
- Use **triple equals (`===`)** for comparisons to avoid type coercion issues.
- **Avoid Number, String, and Boolean as Objects**: Always treat numbers, strings, or booleans as primitive values. Not as objects. Declaring these types as objects, slows down execution speed, and produces nasty side effects (e.g., cannot compare a String object with a string primitive), or cannot compare objects by default.
- **Avoid using `eval()`**: The `eval()` function is used to run text as code. In almost all cases, it should not be necessary to use it. It poses serious security risk as it allows arbitrary code to be executed.
- Never set `undefined` to a variable manually. Use `null` instead to indicate an empty value. As a guideline, JavaScript's `undefined` should only be used by the JavaScript engine itself. In other words, `undefined` is set naturally. Use `null` for intentional purposes, i.e., to indicate that a variable has no value for now.

---

## CSS Guidelines

### Layout Philosophy

- Think **outside-in**: design from the largest page regions down to the smallest component details before writing any CSS.
- Each container is responsible only for laying out its **direct children** — do not attempt to control deeply nested elements from a parent layout.
- Avoid using a single monolithic layout to control the entire page. Each component is its own layout context.
- Build in phases: macro layout → component layout → spacing and typography → visual polish. Do not style details before structure is solid.
- Write **semantic HTML first** — structure and content before any layout CSS.

### When to Use Grid vs. Flexbox

**Use Grid when:**

- Laying out elements in **two dimensions** (rows and columns simultaneously)
- A defined, explicit structure is needed — full page layout, card grids, named regions
- A component's sole responsibility is arranging items in a two-dimensional layout (e.g., `<CardGrid>`, `<PhotoGrid>`)

**Use Flexbox when:**

- Laying out elements in **one dimension** — a row of links or a vertical stack
- Items need to grow or shrink dynamically
- Aligning elements inside a component (icon + label, button groups, header with title and action)

Real-world pages use both: Grid for page structure, Flexbox inside regions for components.

| Scope | Primary tool |
| --- | --- |
| Page structure | Grid |
| Section / region layout | Grid or Flexbox |
| Individual component internals | Flexbox |
| Inline element alignment | Flexbox |

### React Components

- Inside a React component, **default to Flexbox**. Components are micro-layouts — small, self-contained pieces of UI that are almost always one-dimensional alignment problems.
- Reach for Grid inside a component only when the component's explicit purpose is a two-dimensional layout. Its children should still use Flexbox internally.
- A component that requires a complex internal Grid layout is often a signal that it is doing too much — revisit the single responsibility principle.

### Spacing

- Use **`gap`** on flex and grid containers for spacing between items — do not apply margins to individual children for this purpose.
- Use **`padding`** for internal component spacing (e.g., button padding, card padding, nav link hit areas).
- Use **`margin`** sparingly: acceptable for vertical rhythm in text-heavy content, one-off nudges, or `margin: 0 auto` for centering a block element with a fixed width.
- Avoid using `margin` for layout alignment — that is the responsibility of Grid and Flexbox.

### Responsive Design

- Consider **mobile and desktop layouts from the start**, not as an afterthought. Sketch at least two versions — mobile and desktop — before writing any CSS.
- Prefer **intrinsically responsive** techniques over explicit breakpoints where possible:
  - Grid: use `repeat(auto-fit, minmax(250px, 1fr))` to let the grid determine column count automatically
  - Flexbox: use `flex-wrap: wrap` combined with `flex-basis` to allow natural reflow without breakpoints
- When a layout direction change is required (e.g., row on desktop → column on mobile), use a media query — but prefer a single, deliberate breakpoint over many fragmented ones:

```css
.header {
  display: flex;
  flex-direction: row;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
  }
}
```

- Avoid `px` for spacing and font sizes where `rem` or `em` would better support accessibility and scaling.

### Navigation — Mobile Patterns

- Do not simply collapse a horizontal nav into a visible vertical column on mobile — this is rarely the right UX choice.
- Prefer one of these established patterns:
  - **Hamburger menu** (most common): hide links by default, reveal on toggle via an `open` class controlled by JavaScript
  - **Slide-in drawer**: a panel sliding in from the left or right, suitable for app-like interfaces
  - **Bottom navigation bar**: fixed bar at the bottom of the screen, appropriate for mobile-first apps with 3–5 top-level destinations
- Ensure all tap targets meet the minimum accessible size of **44×44px**.

```css
.nav-links {
  display: flex;
  gap: 1rem;
}

.hamburger {
  display: none;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
    flex-direction: column;
    width: 100%;
  }

  .nav-links.open {
    display: flex;
  }

  .hamburger {
    display: block;
  }
}
```

### Collapse / Expand Animations

- Avoid toggling `display: none` / `display: block` when animated transitions are needed — it produces an instant snap with no animation.
- Avoid the `max-height` transition trick — it bases duration on the max value rather than actual content height, producing sluggish or uneven animations.
- Prefer the **`grid-template-rows` technique** for smooth, content-aware height transitions:

```css
.collapsible-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}

.collapsible-body > div {
  overflow: hidden;
}

.collapsible-body.open {
  grid-template-rows: 1fr;
}
```

- Always include `aria-expanded` on trigger elements for accessibility.

---
