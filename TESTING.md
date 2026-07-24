# Iron Capital — Frontend Testing Doctrine

This document is the single source of truth for **how we write frontend tests**.
It is a companion to [AGENTS.md](./AGENTS.md) (general engineering guidelines)
and [DESIGN.md](./DESIGN.md) (design language).

The rules here are deliberately **strict and uniform**. As more code is written
by and with AI, a human reviewer must be able to spot a broken convention **at a
glance**. Uniformity is the point: every test in this repo — and, where the
shape allows, every test in our backend repo [`arkad`](https://github.com/ironcapitaleu/arkad) —
should read the same way, so a reviewer's eye knows exactly where to look.

> **The shape is non-negotiable. The judgement is in what you assert.**
> The structure below (AADA, one `expect`, `should … when …`) never bends. The
> frontend-specific principles that follow tell you how to make that single
> assertion *meaningful* — they add rigour, they do not loosen the shape.

---

## 1. The uniform shape (identical to the backend)

These four rules are inherited verbatim from the `arkad` backend doctrine (see
[AGENTS.md § Library Code → Testing](./AGENTS.md)). They apply to **every** test
in this repository, TypeScript and TSX alike.

### 1.1 Arrange–Define–Act–Assert (AADA)

Every test body is four clearly separated phases, in this order:

- **Arrange** — set up the world: render components, mount hooks, build mocks,
  seed inputs.
- **Define** — declare the expected outcome in a single variable, `expectedResult`.
- **Act** — execute the behaviour under test and capture it in a single variable,
  `result`.
- **Assert** — one comparison of `result` against `expectedResult`.

Separate the phases with blank lines. Do not interleave them. The Define phase
comes *before* Act so the reader knows the target before seeing the mechanics —
this is the one deviation from vanilla "Arrange, Act, Assert", and it is
deliberate.

For comparison, this is the exact pattern in `arkad` (Rust):

```rust
#[test]
fn should_parse_annual_frame_when_input_is_cy2024() {
    let expected_result = Some(Frame { year: 2024, quarter: None, instant: false });

    let result = Frame::parse("CY2024");

    assert_eq!(result, expected_result);
}
```

Our TypeScript translates it one-to-one — same phases, same variable names.

### 1.2 Exactly ONE `expect` per test

**Write exactly one `expect(...)` assertion per test.** No exceptions.

This is the rule most likely to be violated by habit or by AI, and the one a
reviewer scans for first. If you feel the urge to add a second `expect`, you
have one of two situations:

- **A composite UI outcome that belongs together** — assert it as a single
  structured object:

  ```ts
  const expectedResult = { submitDisabled: true, spinnerShown: true };

  const result = {
    submitDisabled: screen.getByRole("button", { name: /submit/i }).hasAttribute("disabled"),
    spinnerShown: screen.queryByRole("status") !== null,
  };

  expect(result).toEqual(expectedResult);
  ```

- **Two genuinely independent behaviours** — split them into two tests, each
  with its own `should … when …` name and its own single assertion.

Never reach for a second `expect`. Never reach for `expect.assertions(n)` as a
way to smuggle several in.

### 1.3 `should … when …` test names

The **description string** passed to `it()` (never the function) starts with
`should` and states the observable outcome, then `when` states the condition:

```ts
it("should return null when the user is not authenticated", () => { /* … */ });
```

Prefer explicit and verbose over clever and short. The name is documentation;
it should read as a sentence a non-author can verify against the assertion.

### 1.4 Colocation and pretty assertions

- Place each test file **next to the code it tests**: `useAuth.ts` →
  `useAuth.test.ts`; `Header.tsx` → `Header.test.tsx`. The `unit` Vitest project
  globs `src/**/*.test.{ts,tsx}` (see [`vite.config.ts`](./vite.config.ts)).
- Use **jest-dom matchers** (`toBeInTheDocument`, `toBeDisabled`,
  `toHaveTextContent`, …) as our "pretty assertions" — they are the readable-diff
  equivalent of `arkad`'s `pretty_assertions::assert_eq`. They are registered
  globally in [`src/test/setup.ts`](./src/test/setup.ts).

---

## 2. Frontend-specific principles (added rigour, not looser shape)

These make the single assertion in §1.2 *worth* asserting. They constrain **what**
you test and **how** you reach the value — they never add a second `expect`.

### 2.1 Test behaviour, not implementation

Assert **what the user perceives** — rendered text, roles, enabled/disabled
state, what appears and disappears. Never assert internal component state, props,
hook internals, or that a particular function was called as a proxy for
behaviour. A test that survives a refactor which preserves behaviour is a good
test.

### 2.2 Query priority: role and label first

Reach for queries in this order, stopping at the first that fits:

1. `getByRole` (optionally with `{ name }`) — matches how users and assistive
   tech navigate.
2. `getByLabelText`, `getByPlaceholderText`, `getByText`.
3. `getByTestId` — **last resort only**, when no accessible query works.

If a component is hard to query by role, that is usually an accessibility gap
worth fixing in the component, not a reason to reach for `data-testid`.

### 2.3 `user-event` over `fireEvent`

Drive interactions with `@testing-library/user-event`, which models real user
input (focus, key sequences, pointer events). Set it up once per test with
`const user = userEvent.setup()` and `await` every interaction. Reserve
`fireEvent` for the rare low-level event `user-event` cannot express.

### 2.4 Async: `findBy*` / `waitFor`

For anything asynchronous (data loading, auth resolution, transitions), await a
`findBy*` query or `waitFor`. Do not sprinkle arbitrary timeouts. Wrap
state-updating renders in `act(...)` when React warns about it.

### 2.5 Lean integration over micro-units

"Write tests, not too many, mostly integration." Prefer a test that renders a
component with its real children and asserts a user-visible outcome over many
tests that each poke one prop. Cover the seams (a page with its router, a form
with its validation) rather than every trivial leaf in isolation.

---

## 3. Shared test infrastructure (`src/test/`)

To keep the Arrange phase uniform and short, common setup lives in `src/test/`:

- **A custom `render()`** that wraps the subject in the app's real providers —
  `AuthProvider` and a router (`MemoryRouter` for unit tests). Prefer it over
  bare `@testing-library/react` `render` for anything that consumes auth or
  routing, so tests exercise the real provider tree.
- **A reusable Supabase mock factory** that produces a configurable fake
  `supabase` client (session present/absent, sign-in success/error). This
  consolidates the ad-hoc mocks currently duplicated in `App.test.tsx` and
  `src/test/setup.ts`.

> Building this shared infra is tracked work — see the `[TEST]` implementation
> ticket. Until it lands, mock Supabase inline as `App.test.tsx` does today, but
> keep the AADA shape and single assertion.

---

## 4. Test layers — what to write where

| Layer | Where | What it covers |
| --- | --- | --- |
| **Storybook stories + interaction (play) tests** | `src/components/ui/**/*.stories.tsx` | Visual primitives and their interactive behaviour (the `storybook` Vitest project, real browser via Playwright). |
| **Unit / integration tests** | colocated `*.test.ts(x)` (the `unit` project, jsdom) | Hooks, contexts, `lib/` utilities, presentational components, and page-level logic. |

Rules of thumb:

- A `ui/*` primitive with meaningful interaction (open/close, select, toggle)
  earns a **play test** in its story; a purely presentational one may not need a
  separate unit test.
- Hooks, contexts, and `lib/` utilities get **unit tests**.
- Pages get **integration tests** rendered through the custom `render()` and, where
  routing matters, a `MemoryRouter`.
- Extract logic that is awkward to test through the DOM into **pure functions**
  and unit-test those directly (see §5).

---

## 5. Make hard-to-test logic testable

When behaviour is buried inside a component's render, lift it into a pure
function and test the function. The canonical case is **`StockScreener`**: its
filtering and sorting should be extracted into pure helpers (e.g.
`filterStocks(stocks, criteria)`, `sortStocks(stocks, key, direction)`) that take
data in and return data out. Pure functions test cleanly in the AADA shape with a
single `toEqual`, and the component becomes a thin, easily-rendered shell.

---

## 6. Coverage gate

Coverage is measured by the v8 provider (configured in
[`vite.config.ts`](./vite.config.ts)). Today there are **no thresholds** — that
is the gap the `[TEST]` ticket closes:

- Add Vitest `coverage.thresholds` and wire them into `npm run test:ci` so a
  regression below the floor fails CI.
- Set an **achievable initial floor** based on the baseline the first slice of
  tests establishes, then **ratchet it upward** as coverage grows. Prefer a floor
  that holds the line over an aspirational number that blocks every PR.

---

## 7. Worked examples (this repo's real style)

### 7.1 A pure utility — `src/lib/utils.test.ts`

```ts
import { describe, it, expect } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("should keep the last conflicting class when tailwind utilities collide", () => {
    const expectedResult = "px-4";

    const result = cn("px-2", "px-4");

    expect(result).toBe(expectedResult);
  });
});
```

### 7.2 An interactive component — `src/components/ui/accordion/accordion.test.tsx`

The existing accordion test is the reference. Note the four phases, the single
assertion, and the `should … when …` name:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

describe("Accordion", () => {
  it("should display content when the trigger is clicked", async () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Account</AccordionTrigger>
          <AccordionContent>Account content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const user = userEvent.setup();

    const expectedResult = "Account content";

    await user.click(screen.getByText("Account"));
    const result = (await screen.findByText("Account content")).textContent;

    expect(result).toBe(expectedResult);
  });
});
```

### 7.3 A composite UI outcome as one object — a login form

When several observable facts describe one behaviour, assert them together in a
single structured `expectedResult` — never as several `expect` calls:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("should disable submit and show a spinner when a sign-in is in flight", async () => {
    // Arrange: render with a Supabase mock whose sign-in never resolves (in-flight)
    render(<LoginPage />);
    // …trigger submit via user-event…

    const expectedResult = { submitDisabled: true, spinnerShown: true };

    const result = {
      submitDisabled: screen.getByRole("button", { name: /sign in/i }).hasAttribute("disabled"),
      spinnerShown: screen.queryByRole("status") !== null,
    };

    expect(result).toEqual(expectedResult);
  });
});
```

---

## 8. Checklist before you open a PR

- [ ] Every test is AADA with blank-line-separated phases.
- [ ] Every test has **exactly one** `expect`.
- [ ] Every test name is `should … when …`.
- [ ] Queries prefer `getByRole` / `getByLabelText`; `getByTestId` only as a last resort.
- [ ] Interactions use `user-event`; async uses `findBy*` / `waitFor`.
- [ ] Assertions are about user-visible behaviour, not implementation details.
- [ ] Test files are colocated with their subject.
- [ ] `npm run test:ci` passes and coverage stays at or above the floor.
