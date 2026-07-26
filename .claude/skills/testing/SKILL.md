---
name: testing
description: >
  This skill should be used when the user asks to "review tests", "add tests", "check test coverage",
  "write play tests", "add interaction tests", "test responsiveness", "re-test a page", "test recent
  components", "review testing strategy", or reports a bug/regression that needs a test so it can't
  recur. Covers writing, reviewing, or improving unit tests, Storybook play tests, and
  visual/responsive coverage for a component, page, hook, or utility.
version: 0.1.0
argument-hint: "[target-path or 'recent' or 'review']"
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

**A reported bug is a missing test.** Whenever a logical bug, regression, or unrecorded
behaviour surfaces — during a PR, from a review, or from plain user feedback — the job is two
parts: (a) fix the behaviour, and (b) ask *"why didn't a test catch this, and what test makes
sure it never happens again?"*, then write that test (and, where the same class of mistake
could recur elsewhere, tests for the siblings). The regression test lands with the fix, not
later. See **Proactive Behavior**.

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
- **Does it talk to an external system (auth, network, storage)?** → arrange the world with a fake behind the port (see Fakes below) — e.g. auth through an `AuthGateway` fake, never a raw vendor stub
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
   play tests in real browsers: interactions, all themes (the class-based theming decorator),
   viewport variants, axe checks via `addon-a11y`.

A third, pixel-level visual-regression layer (snapshot-diffing the rendered stories) is
**planned but not adopted** — tool choice and workflow are to be spiked first (see TESTING.md §3
and STA-140). Do not present it as existing infrastructure. Story coverage stays mandatory
regardless: stories are the visual record any future snapshot layer will consume.

When reviewing a UI change, ask: which layers cover it? A change is complete when its logic is
unit-tested, its states have stories, its interactions have a play test, and it holds at its
breakpoints in all themes.

## Baseline Tests (apply to ALL components)

The floor of coverage every component carries, so a broken render or a dropped prop can never
land silently. At minimum:

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

The second test is **not** CSS testing. It asserts the component's *composability
contract* — that a consumer's `className` is forwarded and merged so the component can be
restyled and arranged wherever it's placed — a structural behaviour that jsdom can check
cheaply. Whether those classes *look* right (colour, spacing, dark mode) is visual
correctness, and that lives in layer 2 (Storybook, real browser), never in a jsdom class-string
assertion. Keep the two straight: forwarding is a contract; appearance is visual.

And every `ui/*` primitive gets, at minimum, a `Playground` story plus one story per variant
(the `component-scaffold` skill generates these). If you encounter a component missing its
baseline tests or stories, add them proactively.

## Fakes (behind interfaces, with dependency injection)

A fake is defined by an **interface we own** (a "port"), not by the third-party dependency it
stands in for. This is the ports-and-adapters (hexagonal) idea: an interface is the contract;
the real vendor is one adapter that implements it; the fake is another. The fake conforms to
*our* interface — it never has to imitate the vendor's API. Full doctrine and worked example
in `TESTING.md` §5; the operational shape:

### Three roles

1. **The port** — a TypeScript `interface` the app owns, in the app's own vocabulary, that
   conceals the vendor. It states what the app needs, not what the vendor offers, so the
   vendor's name never appears in it (e.g. an `AuthGateway`, not a Supabase client).
2. **The real adapter** — implements the port by wrapping the vendor. This is the *only* place
   the vendor is named.
3. **The fake** — implements the *same port* with fixed, named behaviour. It conforms to the
   interface, not to the vendor's response shapes.

### Inject the fake — don't mock the module

Components and hooks depend on the **port**, handed to them through a provider (dependency
injection), never on the concrete vendor. A test arranges the world by injecting the fake
through that provider:

```tsx
render(
  <AuthProvider gateway={alwaysUnauthenticatedAuth()}>
    <LoginPage />
  </AuthProvider>,
);
```

There is nothing to `vi.mock` here — that is the payoff of DI. `vi.mock` is only an interim
seam for code that still imports a vendor module directly (as `useAuth` imports `supabase`
today); introducing the port removes both the coupling and the mock. Treat any inline vendor
stub as debt until the port lands (STA-141), never as the pattern.

### Conventions

- **Fixed, not scripted:** a fake returns predetermined values — no logic, no state mutation,
  no "was called with" expectations. You name the world ("the user is signed out"); the single
  assertion stays on what the user sees.
- **Naming:** `always{Behavior}{Port}` — `alwaysAuthenticatedAuth`, `alwaysUnauthenticatedAuth`,
  `alwaysFailingAuth`. Fakes live in `src/test/fixtures/{port}/`, one file per behaviour.
- **When to create one:** the app talks to an external system (auth, network, storage) a test
  must not hit, or you need an error-path behaviour (the always-failing variant).
- **When NOT to:** pure functions and presentational components (test them directly); child
  components in an integration test (render the real tree); the router (use a real
  `MemoryRouter`, not a faked navigate).

### The custom `render()`

Wraps the subject in the real provider tree (`AuthProvider` + `MemoryRouter`). Prefer it for
anything that consumes auth or routing; use `initialEntries` to place the router on the route
under test, and pass a fake gateway to arrange the auth world.

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

1. **Turn every reported bug into a test.** When a logical bug, regression, or unrecorded
   behaviour is reported — in a PR, a review, or plain user feedback — first reproduce and fix
   it, then ask *"why didn't a test catch this?"* and write the test that would have. The
   regression test lands in the same change as the fix. Then propagate: if the same class of
   mistake could hide in sibling components, cover them too.
2. **Fill baseline gaps everywhere** — a component without baseline tests or stories gets them without asking
3. **Suggest meaningful behavioural tests** based on the component's public surface:
   - Happy path for each user-facing behaviour
   - Error/empty states (failed sign-in, empty screener results, missing data)
   - Edge cases (long text, unicode, keyboard-only interaction)
   - All themes and the component's breakpoints for anything visual
4. **Suggest extraction** when logic is buried in a render — pure function first, then test it
5. **Inquire with the user** about:
   - Which user flows are most critical
   - Which regressions have actually been observed before (these become permanent tests)
6. **Proactively propagate** — when fixing a test-shape violation in one file, search for all
   files with the same violation and fix them all in one pass

## Self-Improvement

After completing a testing session where the user corrected or refined a pattern:

1. Ask: "Should I update the testing skill (or TESTING.md) with this pattern?"
2. If yes, update the relevant section — skill for operational patterns, TESTING.md for doctrine.
3. Apply after user approval.

Examples worth capturing:
- New test patterns that emerged (e.g., a better way to test the auth flow)
- Play-test patterns that proved valuable
- New fakes and fake behaviours that other tests will want
- Few-shot examples that drifted from actual code — update them
- New tests that make good few-shot examples — add them
- Tests where the user had to correct the agent — add as examples to prevent repeating mistakes

Also periodically review: do the existing few-shot examples still match the codebase?
If not, update them. If a new test is a better or complementary example, add it.
The examples are authoritative guidance — they must reflect reality.

**TESTING.md and AGENTS.md take priority.** If this skill diverges from them, they win. When
updating this skill, check both for conflicts and resolve in their favor.

**Proactive divergence detection.** When working on tests, if you suspect existing tests in the
codebase diverge from the doctrine, fix them proactively without waiting to be asked.

This keeps the skill growing from real usage rather than speculation.
