---
name: testing
description: >
  This skill should be used when the user asks to "review tests", "add tests", "check test coverage",
  "write play tests", "add interaction tests", "test responsiveness", "review testing strategy",
  or needs to write, review, or improve unit tests, Storybook play tests, or visual/responsive
  coverage for a component, hook, page, or utility.
version: 0.1.0
argument-hint: "[module-or-file-path]"
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion]
---

# Testing Skill

## Purpose

Write, review, and improve tests for any part of the frontend. Covers unit/integration tests
(jsdom, colocated `*.test.ts(x)`), Storybook interaction (play) tests (real browser), and
visual/responsive coverage via stories. Proactively suggests meaningful tests and fills the
layers a change is missing.

The doctrine lives in `TESTING.md` at the repo root — read it before writing tests. This skill
is the *operational* companion: how to pick what to test, in which layer, with which pattern.

## Context Gathering

If no specific target is provided, gather context automatically:

1. Check recent conversation history — what was just implemented or discussed?
2. Check `git diff` — what files were recently modified?
3. From context, identify the target and suggest options to the user via `AskUserQuestion`

When a target is identified (either from context or user input), reason about:

- **What kind of code is it?**
  - A pure function or `lib/` utility → layer-1 unit tests, `toEqual` on data in/out
  - A hook (`useAuth`, …) → layer-1 `renderHook` tests with faked dependencies
  - A context (`AuthContext`) → layer-1 tests through a probe consumer component
  - A presentational component (Header, Footer, …) → layer-1 render tests + a story
  - A page → layer-1 integration test via the custom `render()` + `MemoryRouter`
  - A `ui/*` primitive → stories for every meaningful state; play test if interactive
  - A layout-bearing/responsive component → viewport-variant stories, play tests at its breakpoints
  - A motion-bearing component (collapse/expand, hover reveal) → endpoint tests (open/closed states); check the mechanism follows the motion conventions (review item)
- **Does it depend on Supabase/auth?** → arrange the world with a Supabase fake (see Fakes below)
- **Does it branch on a media query?** → unit-testable via the `matchMedia` stub in `src/test/setup.ts`; CSS-breakpoint layout is NOT — that goes to the browser layer
- **Is behaviour buried in a component's render?** → extract it into a pure function first, then test the function (the `StockScreener` filter/sort pattern)
- **Is it async?** → plan `findBy*` / `waitFor`, never timeouts

Based on this reasoning, suggest what tests to write/review and let the user confirm or adjust.

## Modes

- **Review** — audit existing tests for a module/component, find gaps across the layers
- **Write** — add missing tests (baseline + meaningful behavioural tests)
- **Interaction** — add or improve Storybook play tests for a component
- **Visual/responsive** — add viewport-variant stories and breakpoint coverage for a layout-bearing component
- **Compliance check** — verify tests follow the uniform shape (AADA, one `expect`, naming, colocation)

## Conventions (Quick Reference)

Authoritative source: `TESTING.md`. Summary:

- **Pattern:** Arrange, Define (`expectedResult`), Act (`result`), Assert — blank lines between phases, no `// Arrange`-style labels
- **Exactly ONE `expect` per test** — composite outcomes as a single structured object; otherwise split into uniform single-assert tests. Applies to play tests too: script the steps, close with one assertion
- **Naming:** `should … when …` for every test description (the string passed to `it()`)
- **Location:** colocated `[filename].test.ts(x)`; play tests inside the component's `*.stories.tsx`
- **Assertions:** jest-dom matchers (`toBeInTheDocument`, `toBeDisabled`, …) as the pretty assertions
- **Queries:** `getByRole`/`getByLabelText` first; `getByTestId` last resort — a component that can't be queried accessibly has an a11y gap worth fixing
- **Interactions:** `@testing-library/user-event` (`const user = userEvent.setup()`, `await` everything); `fireEvent` only for events user-event can't express
- **Async:** `findBy*` / `waitFor`; wrap state-updating renders in `act(...)` when React warns
- **Behaviour, not implementation:** assert what the user perceives; never internal state, props, or call counts as proxies

## The Test Layers — where a test belongs

1. **Unit/integration (jsdom, `npm run test:dev` / `test:ci`)** — logic and DOM behaviour.
   jsdom computes no CSS: never assert Tailwind class strings as a stand-in for layout.
2. **Interaction & visual behaviour (Storybook + Playwright, `npm run test:storybook`)** —
   play tests in real browsers: interactions, both themes (the class-based light/dark decorator),
   viewport variants, axe checks via `addon-a11y`.

A third, pixel-level visual-regression layer (snapshot-diffing the rendered stories) is
**planned but not adopted** — tool choice and workflow are to be spiked first (see TESTING.md §3
and STA-140). Do not present it as existing infrastructure. Story coverage stays mandatory
regardless: stories are the visual record any future snapshot layer will consume.

When reviewing a UI change, ask: which layers cover it? A change is complete when its logic is
unit-tested, its states have stories, its interactions have a play test, and it holds at its
breakpoints in both themes.

## Baseline Tests (apply to ALL components)

The frontend counterpart of the backend's boilerplate auto-trait tests. Every component gets,
at minimum:

```tsx
describe("MyComponent", () => {
  it("should render its content when mounted", () => {
    render(<MyComponent>Content</MyComponent>);

    const expectedResult = "Content";

    const result = screen.getByText("Content").textContent;

    expect(result).toBe(expectedResult);
  });

  it("should merge a custom class when className is provided", () => {
    render(<MyComponent className="custom-class">Content</MyComponent>);

    const expectedResult = true;

    const result = screen.getByText("Content").className.includes("custom-class");

    expect(result).toBe(expectedResult);
  });
});
```

And every `ui/*` primitive gets, at minimum, a `Playground` story plus one story per variant
(the `component-scaffold` skill generates these). If you encounter a component missing its
baseline tests or stories, add them proactively.

## Fakes

### What is a Fake

A fake is a minimal implementation of an external dependency that returns fixed, predictable
responses. Fakes decouple unit tests from real external systems (network, auth, storage) and
keep the Arrange phase declarative: you name the world ("the user is signed out"), you don't
script it. No logic, no state mutation, no call expectations — just a predetermined behaviour.

This is a deliberate stance: **fakes over mocks**. Per-test stub configuration and
"was called with" assertions couple tests to implementation and violate the
behaviour-not-implementation principle. The single assertion stays on what the user sees.

### Where to put them

Fakes live in `src/test/fixtures/` — one directory per faked concept, one file per behaviour,
mirroring the backend's `tests/fixtures/sample_{concept}/` layout:

```text
src/test/fixtures/
└── supabase/
    ├── always-authenticated.ts
    ├── always-unauthenticated.ts
    └── always-failing.ts
```

### How to define a Fake

A fake implements the dependency's surface with fixed behavior — hardcoded, predictable values:

```ts
// src/test/fixtures/supabase/always-unauthenticated.ts

/**
 * A Supabase client whose auth methods always behave as if no user is
 * signed in. Session queries resolve to null; sign-in attempts fail.
 */
export function alwaysUnauthenticatedSupabase() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      }),
    },
  };
}
```

### Naming conventions

- **Behaviour-named factories:** `always{Behavior}{Concept}` (e.g. `alwaysAuthenticatedSupabase`,
  `alwaysUnauthenticatedSupabase`, `alwaysFailingSupabase`) — the direct translation of the
  backend's `Always{Behavior}{ConceptName}` fakes (`AlwaysSucceedingHttpClient`,
  `AlwaysFailingHttpClient`).
- File per behaviour, kebab-case: `always-unauthenticated.ts`.

### When to create a Fake

- The dependency crosses a system boundary (Supabase, network, storage)
- You need to test error-handling paths (the always-failing variant)
- The same world is arranged in more than one test file — one fake serves many tests

### When NOT to create a Fake

- Pure functions and presentational components — test them directly
- Child components in an integration test — render the real tree; that's the point
- The router — use a real `MemoryRouter`, not a faked navigate function

### How and where to use Fakes

`vi.mock(...)` is only the **injection mechanism** (module substitution); what gets injected
is a fake:

```ts
// In a test file — arrange the signed-out world
vi.mock("./lib/supabase", async () => {
  const { alwaysUnauthenticatedSupabase } = await import(
    "./test/fixtures/supabase/always-unauthenticated"
  );
  return { supabase: alwaysUnauthenticatedSupabase() };
});
```

Never let a unit test hit the network. Until the fixtures land (tracked in STA-141), keep
inline stand-ins small, fixed, and predictable — fake-shaped, like `App.test.tsx`'s current
inline stub — and migrate them into `src/test/fixtures/` when it does.

### The custom `render()`

Wraps the subject in the real provider tree (`AuthProvider` + `MemoryRouter`). Prefer it for
anything that consumes auth or routing; use `initialEntries` to place the router on the route
under test.

## Unit Test Patterns

### Pure function — happy path + edge

```ts
it("should filter out stocks below the market-cap threshold when a minimum is set", () => {
  const stocks = [smallCap, largeCap];
  const criteria = { minMarketCap: 1_000_000_000 };

  const expectedResult = [largeCap];

  const result = filterStocks(stocks, criteria);

  expect(result).toEqual(expectedResult);
});
```

### Hook — assert the returned surface

```ts
it("should expose a null user when no session exists", async () => {
  const { result: hook } = renderHook(() => useAuth());

  const expectedResult = { user: null, loading: false };

  await waitFor(() => hook.current.loading === false);
  const result = { user: hook.current.user, loading: hook.current.loading };

  expect(result).toEqual(expectedResult);
});
```

### Context — probe through a consumer

```tsx
function Probe() {
  const { user } = useAuthContext();
  return <span>{user ? user.email : "signed out"}</span>;
}

it("should provide the signed-out state when no session exists", async () => {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

  const expectedResult = "signed out";

  const result = (await screen.findByText("signed out")).textContent;

  expect(result).toBe(expectedResult);
});
```

### Page — through the real router

```tsx
it("should show the not-found message when navigating to an unknown route", () => {
  render(
    <MemoryRouter initialEntries={["/does-not-exist"]}>
      <App />
    </MemoryRouter>,
  );

  const expectedResult = true;

  const result = screen.getByRole("heading", { name: /not found/i }) !== null;

  expect(result).toBe(expectedResult);
});
```

## Play Test Patterns

Play tests live in the component's story file and run in a real browser. Import from
`storybook/test` (`expect`, `userEvent`, `within`). Script the interaction, close with one
composite assertion:

```tsx
export const OpensOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const expectedResult = { panelVisible: true, triggerExpanded: "true" };

    await userEvent.click(canvas.getByRole("button", { name: /filters/i }));
    const result = {
      panelVisible: canvas.getByText(/market cap/i) !== null,
      triggerExpanded: canvas
        .getByRole("button", { name: /filters/i })
        .getAttribute("aria-expanded"),
    };

    await expect(result).toEqual(expectedResult);
  },
};
```

### Responsive/viewport stories

For layout-bearing components, add viewport-variant stories at the component's **own**
breakpoints (where its layout genuinely changes — e.g. where the nav collapses into the
mobile menu), not a fixed device list. Give each variant a story so it is exercised by play
tests (and captured by visual regression once that layer is adopted). Test motion by its
**endpoints** (menu closed → click → menu open); the animation itself is carried by the
catalog and review until a pixel-diffing layer exists.

## Proactive Behavior

When reviewing or writing tests:

1. **Fill baseline gaps everywhere** — a component without baseline tests or stories gets them without asking
2. **Suggest meaningful behavioural tests** based on the component's public surface:
   - Happy path for each user-facing behaviour
   - Error/empty states (failed sign-in, empty screener results, missing data)
   - Edge cases (long text, unicode, keyboard-only interaction)
   - Both themes and the component's breakpoints for anything visual
3. **Suggest extraction** when logic is buried in a render — pure function first, then test it
4. **Inquire with the user** about:
   - Which user flows are most critical
   - Which regressions have actually been observed before (these become permanent tests)
5. **Proactively propagate** — when fixing a test-shape violation in one file, search for all
   files with the same violation and fix them all in one pass

## Self-Improvement

After completing a testing session where the user corrected or refined a pattern:

1. Ask: "Should I update the testing skill (or TESTING.md) with this pattern?"
2. If yes, update the relevant section — skill for operational patterns, TESTING.md for doctrine.
3. Apply after user approval.

Examples worth capturing:
- New test patterns that emerged (e.g., a better way to test the auth flow)
- Play-test patterns that proved valuable
- Few-shot examples that drifted from actual code — update them
- Tests where the user had to correct the agent — add as examples to prevent repeating mistakes

**TESTING.md and AGENTS.md take priority.** If this skill diverges from them, they win. When
updating this skill, check both for conflicts and resolve in their favor.

**Proactive divergence detection.** When working on tests, if you suspect existing tests in the
codebase diverge from the doctrine, fix them proactively without waiting to be asked.
