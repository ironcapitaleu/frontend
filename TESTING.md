# Iron Capital — Frontend Testing Doctrine

This document is the single source of truth for **how we write frontend tests**.
It is a companion to [AGENTS.md](./AGENTS.md) (general engineering guidelines)
and [DESIGN.md](./DESIGN.md) (design language), and it closes the loop of the
UI development flow: **design → documentation → testing**. What DESIGN.md
declares and Storybook demonstrates, the tests defend.

The rules here are deliberately **strict and uniform**. Every test in this
repo — and, where the shape allows, every test in our backend repo
[`arkad`](https://github.com/ironcapitaleu/arkad) — reads the same way, so a
reviewer's eye knows exactly where to look and a broken convention stands out
**at a glance**. Uniformity is the point.

> **The shape is non-negotiable. The judgement is in what you assert.**
> The structure below (AADA, one `expect`, `should … when …`) never bends. The
> frontend-specific principles that follow tell you how to make that single
> assertion *meaningful* — they add rigour, they do not loosen the shape.

---

## 1. The uniform shape (identical to the backend)

These four rules are inherited verbatim from the `arkad` backend doctrine (see
[AGENTS.md § Library Code → Testing](./AGENTS.md)). They apply to **every** test
in this repository — unit tests and Storybook play tests alike.

### 1.1 Arrange–Define–Act–Assert (AADA)

Every test body is four clearly separated phases, in this order:

- **Arrange** — set up the world: render components, mount hooks, inject fakes,
  seed inputs.
- **Define** — declare the expected outcome in a single variable, `expectedResult`.
- **Act** — execute the behaviour under test and capture it in a single variable,
  `result`.
- **Assert** — one comparison of `result` against `expectedResult`.

Separate the phases with blank lines. Do not interleave them, and do not label
them with `// Arrange` / `// Act` comments — the structure speaks for itself.
The Define phase comes *before* Act so the reader knows the target before seeing
the mechanics — this is the one deviation from vanilla "Arrange, Act, Assert",
and it is deliberate.

For comparison, this is the exact pattern in `arkad` (Rust) — all four phases
present, including an Arrange that builds the input:

```rust
#[test]
fn should_create_valid_cik_when_input_is_a_ten_digit_string() {
    let cik_input = "1234567890";

    let expected_result = "1234567890";

    let result = Cik::new(cik_input)
        .expect("CIK creation should succeed for a valid ten-digit input");

    assert_eq!(result.value(), expected_result);
}
```

Our TypeScript translates it one-to-one — same phases, same variable names.

### 1.2 Exactly ONE `expect` per test

**Write exactly one `expect(...)` assertion per test.** No exceptions.

This is the rule a reviewer scans for first. If you feel the urge to add a
second `expect`, you have one of two situations:

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

**Play tests follow the same rule.** A `play` function may script several
interaction steps (that is its Act phase), but it ends in a single assertion of
the outcome — composite object if several facts describe it.

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

**`expectedResult` must appear in the assertion, and prefer a meaningful value
over a bare boolean.** The Assert phase (§1.1) is one comparison of `result`
against `expectedResult`, mirroring `arkad`'s `assert_eq!(result, expected_result)`.
So do not end on a matcher that drops `expectedResult` — an argument-less
`expect(el).toBeInTheDocument()`, where `expectedResult` lived only in the query,
is *not* the shape. And prefer asserting **what the content actually is** over a
`true`/`false` presence flag: `expect(result).toBe(true)` tells a failing reader
nothing, `expect(result).toBe("Iron Capital")` tells them everything.

- **Rendered text (default)** — assert the text against the expected string.
  Reach for a jest-dom matcher that *takes* the expected value so it keeps the
  pretty-diff:

  ```ts
  const expectedResult = "Iron Capital";

  const result = screen.getByRole("heading", { name: /Iron Capital/i });

  expect(result).toHaveTextContent(expectedResult);
  ```

  `toHaveAccessibleName(expectedResult)`, `toHaveValue(expectedResult)`, and
  `toHaveAttribute(name, expectedResult)` follow the same shape — use the one
  that names the outcome. For an element with no text of its own (an icon link
  carrying an `aria-label`), assert its accessible name:
  `expect(result).toHaveAccessibleName("Iron Capital home")`.

- **Pure existence / absence (fallback)** — only when there is genuinely no
  content to compare, reduce to a boolean: `const result = screen.queryByText("…")
  !== null; expect(result).toBe(expectedResult)`. Absence uses the same shape with
  `expectedResult = false` (or `queryBy(...)` against `null`).

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

## 3. The test layers

The frontend has failure modes a backend does not: a page can be logically
correct and still **look wrong** — a layout that collapses on mobile, an
animation that jumps, a serif heading that silently fell back to sans. One
environment cannot catch all of that, so tests live in two layers today (with
a third planned — see below). Each layer answers one question, and every UI
change should be able to say which layers cover it.

| Layer | Runs in | Question it answers | Where |
| --- | --- | --- | --- |
| **1. Unit / integration** | jsdom (`unit` Vitest project) | *Does the logic and DOM behaviour work?* | colocated `*.test.ts(x)` |
| **2. Interaction & visual behaviour** | Real browser via Storybook + Playwright (`storybook` Vitest project) | *Does it actually work — and hold up — as rendered, interacted with, across themes and viewports?* | `play` functions in `*.stories.tsx` |

### Layer 1 — unit / integration (jsdom)

Hooks, contexts, `lib/` utilities, pure functions, presentational components,
and page-level logic. Fast, deterministic, no real rendering engine. **Know its
limits:** jsdom does not compute CSS, so it cannot see Tailwind breakpoints,
animations, or layout. Anything whose correctness depends on *rendered
appearance* belongs in layer 2 or 3 — do not fake it in jsdom by asserting
class strings.

### Layer 2 — interaction & visual behaviour (Storybook play tests)

Every interactive component's story earns a `play` test: real browser, real
CSS, real events. This is where we test the things that have historically
regressed silently:

- **Interactions** — open/close, select, toggle, hover reveals, keyboard paths.
- **Responsive behaviour** — the same story exercised at mobile and desktop
  viewports (see §4). A component is not done when it works at 1440px.
- **All themes** — stories render under the class-based theming (the
  `addon-themes` decorator in [.storybook/preview.ts](./.storybook/preview.ts));
  today that is dark and light, but a component must hold in every theme the app
  ships, not just the one it was built in.
- **Accessibility** — `addon-a11y` runs axe checks per story. The current gate
  is `test: "todo"` (violations surface in the test UI); the goal is `"error"`
  once existing violations are cleared. New components should pass from day one.

### Planned third layer — pixel-level visual regression (not yet adopted)

Play tests catch *behavioural* breakage; only pixel comparison catches "the
spacing jumped", "the gradient stopped flowing", "the serif fell back". A
snapshot-diffing layer over the rendered stories would close that gap — but
**adopting one is an open decision, not part of the current doctrine.** Tool
choice (Chromatic — whose Storybook addon happens to ship in our config —
Percy, Lost Pixel, self-hosted Playwright screenshots), cost, and the
baseline-review workflow all need a spike first; the evaluation is tracked in
the testing-strategy SPIKE (STA-140).

What **is** doctrine today: stories are the visual record, and any future
snapshot layer will consume them story-by-story. That is why **story coverage
is test coverage** — a component without stories for its meaningful states is
undocumented now and invisible to that layer later. Keep story coverage
complete so the layer can be switched on without a backfill.

---

## 4. Responsive, motion, and visual regressions

The regressions that hurt most are the ones no unit test sees: a change on one
page shifts a shared component, and suddenly the mobile nav jumps or the filter
panel animation stutters. The doctrine for defending against them:

### 4.1 Responsive

- Layout is built desktop-and-mobile from the start (AGENTS.md's responsive
  methodology); tests must exercise **both**. Stories for layout-bearing
  components define viewport variants — the same story at a mobile width and a
  desktop width — so play tests and visual snapshots cover each breakpoint the
  component actually responds to.
- Test at the component's **own** breakpoints (where its layout genuinely
  changes), not a fixed device list.
- In jsdom, `window.matchMedia` is stubbed (see `src/test/setup.ts`). Logic
  that branches on a media query can be unit-tested by configuring that stub —
  but layout produced by CSS breakpoints cannot, and belongs in layer 2/3.

### 4.2 Motion

Motion is part of the design language (DESIGN.md §5), so it gets defended like
one:

- Test motion **by its observable endpoints**, not its pixels: the filter panel
  is closed, the trigger is clicked, the panel's content is visible/hidden. The
  transition itself is a job for pixel-level visual regression once adopted;
  until then, the Storybook catalog and review carry it.
- The house conventions — height animated via `grid-template-rows`
  (`0fr` → `1fr`), never `display` toggles or the `max-height` trick;
  `.btn-tactile` on buttons — are **review items** (see AGENTS.md § PR Review):
  a wrong mechanism is flagged in review even when the endpoints test green,
  because the wrong mechanism is exactly what produces the subtle jump later.

### 4.3 What "done" means for a UI change

A UI change is complete when:

1. Its logic is unit-tested (layer 1).
2. Its states have stories, and its interactions have a play test (layer 2).
3. Those stories hold at the component's breakpoints and in all themes.
4. It reads correctly against [DESIGN.md](./DESIGN.md) — semantic tokens, the
   right font role, the motion conventions. Design conformance is part of
   review, not an afterthought.

---

## 5. Shared test infrastructure (`src/test/`)

To keep the Arrange phase uniform and short, common setup lives in `src/test/`:

- **A custom `render()`** that wraps the subject in the app's real providers —
  `AuthProvider` and a router (`MemoryRouter` for unit tests). Prefer it over
  bare `@testing-library/react` `render` for anything that consumes auth or
  routing, so tests exercise the real provider tree.
- **Fakes** for external systems, in `src/test/fixtures/` — see below.

### Fakes behind interfaces, not mocks

A fake is defined by an **interface we own**, not by the third-party dependency
it stands in for. This is the ports-and-adapters (hexagonal) idea, and it is
exactly how the backend defines its fakes: the trait `InnerClient` is the
contract; `reqwest` is one adapter that implements it; `FakeInnerClient` is
another. `FakeInnerClient` conforms to `InnerClient` — it never has to imitate
`reqwest`'s API. We do the same on the frontend with three roles:

1. **The port** — a TypeScript `interface` the app owns, written in the app's
   own vocabulary, that *conceals* the vendor. Neither Supabase nor *its types*
   appear in it. Where the backend keeps the dependency abstract with associated
   types, we use **app-owned domain types** — define the small shape the app
   actually needs rather than threading the vendor's `User` / `Session` / `Error`
   through the interface:

   ```ts
   export interface AuthUser {
     id: string;
     email: string | null;
   }

   export interface AuthOutcome {
     error: AuthFailure | null; // AuthFailure is an app-owned error, not the vendor's
   }

   export interface AuthGateway {
     getCurrentUser(): Promise<AuthUser | null>;
     onUserChange(listener: (user: AuthUser | null) => void): () => void;
     signInWithEmail(email: string, password: string): Promise<AuthOutcome>;
     signUpWithEmail(email: string, password: string): Promise<AuthOutcome>;
     signOut(): Promise<AuthOutcome>;
   }
   ```

2. **The real adapter** — implements the port by wrapping the vendor and mapping
   its types down to the app's. This is the *only* place the vendor is named:

   ```ts
   export function supabaseAuthGateway(): AuthGateway {
     /* delegates to supabase.auth.*, mapping User → AuthUser and
        AuthError → an app-owned AuthFailure */
   }
   ```

3. **The fake** — implements the *same port* with fixed, named behaviour. It
   conforms to `AuthGateway`, returning app types directly — never Supabase's
   response shapes:

   ```ts
   // src/test/fixtures/auth/always-unauthenticated.ts
   export function alwaysUnauthenticatedAuth(): AuthGateway {
     return {
       getCurrentUser: async () => null,
       onUserChange: () => () => {},
       signInWithEmail: async () => ({ error: new InvalidCredentials() }),
       signUpWithEmail: async () => ({ error: new InvalidCredentials() }),
       signOut: async () => ({ error: null }),
     };
   }
   ```

**Dependency injection is the whole point.** Components and hooks depend on the
port and receive it through a provider — never on the concrete vendor. A test
arranges the world by injecting the fake through that provider; there is no
vendor to mock and no per-test stubbing:

```ts
render(
  <AuthProvider gateway={alwaysUnauthenticatedAuth()}>
    <LoginPage />
  </AuthProvider>,
);
```

- **Naming:** `always{Behavior}{Port}` — `alwaysAuthenticatedAuth`,
  `alwaysUnauthenticatedAuth`, `alwaysFailingAuth`. Fakes live in
  `src/test/fixtures/{port}/`, one file per behaviour.
- **When to create one:** the app talks to an external system (auth, network,
  storage) a test must not hit, or you need an error-path behaviour.
- **When NOT to:** pure functions and presentational components (test them
  directly); child components in an integration test (render the real tree);
  the router (use a real `MemoryRouter`).

> **On `vi.mock`.** Injecting the fake through the provider means you do *not*
> need `vi.mock`. The `AuthGateway` port (landed in STA-141) removed the last
> direct vendor coupling in `useAuth`, so there is nothing left to mock. `vi.mock`
> remains only an interim seam for any *new* code that still imports a vendor
> module directly — treat that as debt to move behind a port, not the pattern.

> Building this shared infra — the ports, the custom `render()`, and the fakes —
> is tracked in **STA-141**, which also replaces the ad-hoc inline stubs in
> `App.test.tsx` and `src/test/setup.ts`.

---

## 6. What to test where — by kind of code

| Kind of code | Layer | What its tests look like |
| --- | --- | --- |
| Pure function (`lib/`, extracted logic) | 1 | Direct AADA, `toEqual` on data in/out. |
| Hook (`useAuth`, …) | 1 | `renderHook` with providers/fakes; assert returned surface. |
| Context (`AuthContext`) | 1 | Render a probe consumer; assert what a consumer sees. |
| Presentational component (Header, Footer, …) | 1 (+ story) | Render, assert visible content/roles. |
| Page (HomePage, LoginPage, …) | 1 | Custom `render()` + `MemoryRouter`; assert user-visible outcome. |
| `ui/*` primitive | 2 (+ 1 where logic warrants) | Stories for every meaningful state; play test for interaction. |
| Layout-bearing / responsive component | 2 | Viewport-variant stories; play tests at each breakpoint. |
| Motion-bearing component | 1 or 2 for endpoints | Assert open/closed states; motion conventions checked in review. |

When behaviour is buried inside a component's render and awkward to reach
through the DOM, **extract it into a pure function** and test that directly.
The canonical case is `StockScreener`: its filtering and sorting belong in pure
helpers (`filterStocks(stocks, criteria)`, `sortStocks(stocks, key, direction)`)
that test cleanly with a single `toEqual`, leaving the component a thin shell.

---

## 7. Coverage gate

Coverage is measured by the v8 provider (configured in
[`vite.config.ts`](./vite.config.ts)). Today there are **no thresholds** — that
is the gap **STA-141** closes:

- Add Vitest `coverage.thresholds` and wire them into `npm run test:ci` so a
  regression below the floor fails CI.
- Set an **achievable initial floor** based on the baseline the first slice of
  tests establishes, then **ratchet it upward** as coverage grows. Prefer a floor
  that holds the line over an aspirational number that blocks every PR.
- Remember that line coverage only measures layer 1. **Story coverage** —
  every component's meaningful states having stories — is the coverage metric
  for layer 2 (and for any future visual-regression layer), and is checked in
  review.

---

## 8. Worked examples (this repo's real style)

### 8.1 A pure utility — `src/lib/utils.test.ts`

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

### 8.2 An interactive component — `src/components/ui/accordion/accordion.test.tsx`

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

### 8.3 A composite UI outcome as one object — a login form

When several observable facts describe one behaviour, assert them together in a
single structured `expectedResult` — never as several `expect` calls:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("should disable submit and show a spinner when a sign-in is in flight", async () => {
    // Arrange: render with a Supabase fake whose sign-in never resolves (in-flight)
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

### 8.4 A play test — the same shape in a story

The `play` function scripts the interaction (Act), then closes with one
assertion on the observable outcome — a plain string here, since the label after
three clicks says everything:

```tsx
import { expect, userEvent, within } from "storybook/test";

export const CountsClicks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /click me/i });

    const expectedResult = "Clicked 3 times";

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    const result = button.textContent;

    await expect(result).toBe(expectedResult);
  },
};
```

When several facts genuinely describe one outcome, use a composite object of
**meaningful values** (§1.2) — `{ label: "Clicked 3 times", counter: "Clicks: 3" }`,
not a bag of booleans that hides what actually failed.

---

## 9. Checklist before you open a PR

- [ ] Every test is AADA with blank-line-separated phases (no phase-label comments).
- [ ] Every test — play tests included — has **exactly one** `expect`.
- [ ] Every test name is `should … when …`.
- [ ] Queries prefer `getByRole` / `getByLabelText`; `getByTestId` only as a last resort.
- [ ] Interactions use `user-event`; async uses `findBy*` / `waitFor`.
- [ ] Assertions are about user-visible behaviour, not implementation details.
- [ ] Test files are colocated with their subject.
- [ ] New/changed components have stories for their meaningful states; interactive ones have a play test.
- [ ] Layout-bearing changes hold at the component's breakpoints and in all themes.
- [ ] The change reads correctly against [DESIGN.md](./DESIGN.md) — tokens, font roles, motion conventions.
- [ ] `npm run test:ci` and `npm run test:storybook` pass; coverage stays at or above the floor.
