# Iron Capital Frontend

A modern React + Vite application for Iron Capital's investment partnership website (ironcapital.eu).

## Features

- **Timeless-meets-modern Design Language** - A classical foundation (serif
  display type, black-on-white, restrained palette) reinterpreted with modern
  app craft (elegant motion, an accent spark); see [DESIGN.md](./DESIGN.md)
- **Stock Screener** - Advanced filtering and sorting for investment research
- **Company Search** - Comprehensive company information and analysis
- **Responsive Design** - Optimized for all device sizes
- **TypeScript** - Full type safety and better developer experience

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **React Router** for client-side routing
- **Tailwind CSS v4** with design tokens defined in `src/index.css`
- **shadcn / @base-ui** component primitives, catalogued in Storybook
- **Cloudflare Pages** deployment ready

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```

### Development

The application uses an editorial, print-inspired design language built on
Tailwind CSS v4, with all design tokens defined in `src/index.css`. See
[DESIGN.md](./DESIGN.md) for the full design language, [AGENTS.md](./AGENTS.md)
for layout and CSS methodology, [DOCUMENTATION.md](./DOCUMENTATION.md) for the
documentation conventions, and [TESTING.md](./TESTING.md) for the frontend
testing doctrine. In short:

- Classical serif display type (Playfair Display) with Inter for UI text
- Restrained, low-chroma `oklch` color palette with class-based dark mode
- Hairline borders for separation; shadows reserved for floating surfaces
- Small, tactile interactions and content-aware height animations

### Sign-In Against the Local Supabase Stack

The sign-in page at `/login` has no password. A visitor continues with Google,
with GitHub, or with an email. The email gets one mail with a 6-digit code and a
link to `/auth/confirm`. The same form signs in a known email and creates the
account for a new email.

The backend repository `arkad` runs Supabase locally, with a mail viewer. Its
README section "Local Supabase Stack" starts the stack. Then:

1. Copy `.env.example` to `.env.local`. Git ignores `.env.local`.
2. Set `VITE_SUPABASE_ANON_KEY` to the publishable key that `supabase status`
   prints in the `arkad` repository.
3. Start the app with `npm run dev -- --host 127.0.0.1 --port 3000`. The link in
   the mail points to this address.
4. Open <http://127.0.0.1:3000/login>. Read the mail at <http://127.0.0.1:54324>.

Google and GitHub need OAuth apps in the Supabase config. Without them, only
their buttons fail.

`scripts/check-sign-in.mjs` checks the sign-up and the sign-in in a headless
browser. It reads each mail through the JSON API of the mail viewer. CI starts
no Supabase, so run the check by hand while the app runs:

```bash
node scripts/check-sign-in.mjs
```

### Deployment

This application is configured for Cloudflare Pages deployment:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects are handled automatically by Cloudflare Pages for SPAs.

### Project Structure

```bash
src/
├── components/        # Reusable UI components
│   ├── Layout.tsx    # Main layout wrapper
│   └── Header.tsx    # Navigation header
├── pages/            # Route-based page components
│   ├── HomePage.tsx       # Landing page
│   ├── StockScreener.tsx  # Stock filtering tool
│   ├── CompanySearch.tsx  # Company research tool
│   ├── AboutPage.tsx      # Company information
│   └── ContactPage.tsx    # Contact form
├── App.tsx           # Main app component with routing
├── index.css         # Global styles and design system
└── main.tsx         # Application entry point
```

## Detailed Feature Overview

### Stock Screener

- Filter by symbol, company name, sector, price range
- Sort by any column (price, change, volume, market cap, P/E ratio)
- Real-time mock data with responsive table

### Company Search

- Search by company name or stock symbol
- Detailed company information display
- Financial highlights and recent news
- External website links

### Design System

The full design language is documented in [DESIGN.md](./DESIGN.md). Highlights:

- Four typographic roles: `font-classic` (Playfair display), `font-serif`
  (base headings), `font-sans-serif` (Inter UI text), `font-monospace` (data)
- Semantic color tokens (`bg-background`, `text-foreground`, `bg-primary`, …)
  with class-based dark mode — never hard-code colors in components
- Tactile button feedback (`.btn-tactile`) and content-aware height animations
  (`grid-template-rows`)
- Reusable primitives in `src/components/ui`, catalogued in Storybook
  (`npm run storybook`)

## License

Private - Iron Capital Investment Partnership
