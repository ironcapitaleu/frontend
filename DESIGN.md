# Iron Capital — Design Language

This document describes the visual design language of the Iron Capital frontend
as it actually exists in the code. It is a companion to [AGENTS.md](./AGENTS.md):
where AGENTS.md covers **how to build** layouts (Grid vs. Flexbox, spacing,
responsive methodology), this document covers **what the product looks like** —
the brand's typography, color, shape, and motion.

The single source of truth for these tokens is
[`src/index.css`](./src/index.css). If you change a token there, update this
document in the same pass.

---

## 1. Character

Iron Capital is an investment-research product. The design language is
**editorial and classical** — closer to a printed financial journal than to a
typical SaaS dashboard. It leans on serif display type, generous reading
measures, restrained color, and small, tactile interactions. The intent is
_calm authority and timelessness_, not novelty.

Guiding adjectives: **refined, editorial, classical, understated, precise.**

---

## 2. Typography

Type is the primary carrier of the brand. Four font roles are defined as theme
tokens in `@theme inline` and consumed through Tailwind utilities
(`font-serif`, `font-sans-serif`, `font-monospace`, `font-classic`).

| Token               | Stack (first choice)         | Role                                                        |
| ------------------- | ---------------------------- | ---------------------------------------------------------- |
| `--font-classic`    | Playfair Display, Cormorant  | **Signature display face.** Hero statements, page titles.  |
| `--font-serif`      | Times New Roman, Georgia     | Default heading face (`h1`–`h3` in the base layer).        |
| `--font-sans-serif` | Inter Variable               | Body copy, UI text, controls, tables.                      |
| `--font-monospace`  | Roboto Mono Variable         | Numeric/tabular data and code.                             |

`--font-cursive` and `--font-fantasy` are defined but reserved for rare
decorative use; they map to system fonts and are **not** part of the everyday
palette.

The variable webfonts (Inter, Playfair Display, Cormorant, Roboto Mono) are
loaded via `@fontsource-variable/*` imports at the top of `src/index.css`.

### Usage rules

- **Playfair Display (`font-classic`) is the brand voice.** Reach for it on
  marketing-style pages — hero statements, section headings on About, Privacy,
  Sitemap, Contact, and Login. Example from `AboutPage.tsx`:
  `className="font-classic text-5xl md:text-7xl font-medium leading-tight"`.
- **The base layer** already sets `h1`→`font-serif text-36`, `h2`→`text-24`,
  `h3`→`text-18`, so plain headings render as classical serif without extra
  classes. Add `font-classic` when you want the Playfair display voice instead.
- **Body paragraphs** (`<p>`) are justified, capped at `65ch` measure with
  `line-height: 1.6` — a deliberate print-like reading column. Do not remove the
  measure cap on running prose.
- **Numbers and tickers** in the screener/tables should use `font-monospace`
  for column alignment.

### Type scales

Two scales coexist as tokens:

- A **semantic scale** (`text-xs` … `text-5xl`) tuned _small_ for dense data
  UI — note `text-base` is `12px`, not the usual `16px`.
- A **classic point-based scale** (`text-8` … `text-72`, 1pt ≈ 1px) for
  editorial layouts where explicit sizes read better than semantic steps.
  `text-18` is the effective body size; `text-36`/`text-24` are the heading
  sizes wired into the base layer.

---

## 3. Color

Colors are defined as CSS custom properties in `oklch()` and exposed to Tailwind
as `--color-*` theme tokens. **Always style with the semantic tokens**
(`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`,
`bg-primary`, …) — never hard-code hex or raw `oklch()` in components, so that
light/dark theming keeps working.

| Semantic token          | Role                                                   |
| ----------------------- | ------------------------------------------------------ |
| `background`/`foreground` | Page surface and primary ink.                        |
| `primary`               | Brand accent — a blue-violet (hue ≈ 264).              |
| `secondary` / `muted`   | Quiet surfaces and secondary text.                     |
| `accent`                | Subtle hover/active fills.                             |
| `destructive`           | Errors and dangerous actions (red).                    |
| `border` / `input` / `ring` | Hairlines, field borders, focus rings.             |
| `chart-1` … `chart-5`   | Data-visualization series (blue-violet ramp).          |
| `sidebar-*`             | Sidebar-specific surface/accent variants.              |

### Theming

- Dark mode is class-based: the `.dark` class on an ancestor swaps the token
  values, driven by the `@custom-variant dark (&:is(.dark *))` declaration.
- The palette is intentionally **low-chroma and restrained** — accent color is
  used sparingly for emphasis, not decoration.

---

## 4. Shape & elevation

- **Radius** is driven by a single `--radius` base (`0.625rem`) with a derived
  scale (`--radius-sm` … `--radius-4xl`). Prefer the `rounded-*` utilities that
  map to these over ad-hoc pixel radii.
- **Elevation is quiet.** Separation comes primarily from hairline `border`
  tokens; shadows are reserved for genuinely floating surfaces (dialogs,
  popovers). Avoid heavy drop shadows on inline content.

---

## 5. Motion & interaction

Motion is small, physical, and purposeful. The named utilities live in
`src/index.css`:

| Utility                 | Purpose                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `.btn-tactile`          | Buttons lift on hover and depress on active — the house feedback.   |
| `.animate-shake-invalid`| Horizontal shake on invalid form input.                             |
| `.animate-gradient-flow`| Flowing gradient (the `SearchBar` glow border).                     |
| `.animate-glow-once`    | One-shot rotating glow border (AI/emphasis moments).                |
| `.filter-panel`         | `grid-template-rows` collapse/expand (the screener filter panel).   |
| `.mobile-menu`          | `grid-template-rows` collapse for the mobile nav.                   |
| `.glow-nav*`            | Expanding pill navigation (`GlowNavBar`).                           |

Follow the collapse/expand and mobile-nav conventions in AGENTS.md — animate
height via `grid-template-rows` (`0fr` → `1fr`), never `display` toggles or the
`max-height` trick.

---

## 6. Components

Reusable primitives live in [`src/components/ui`](./src/components/ui) and are
built on **shadcn** + **@base-ui**, styled with Tailwind and
`class-variance-authority` variant files (e.g. `button/variants.ts`). Every
primitive ships a `*.stories.tsx` file — **Storybook is the living catalog** of
the design system:

```bash
npm run storybook
```

When building UI, compose these primitives rather than restyling raw elements,
and add a story for anything new.

---

## 7. Quick reference for contributors

- Style with **semantic tokens**, never raw colors — keep dark mode working.
- **Playfair (`font-classic`)** for brand/editorial display; serif base
  headings otherwise; **Inter** for UI; **Roboto Mono** for numbers.
- Keep running prose in a **justified, `65ch`, 1.6-leading** column.
- Buttons get **`.btn-tactile`**; animate height with **`grid-template-rows`**.
- Reach for a **shadcn/ui primitive** first; add a **Storybook story** for new
  ones.
- Change a token in `src/index.css` → update this document in the same commit.
