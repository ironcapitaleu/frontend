# Iron Capital Frontend

A modern React + Vite application for Iron Capital's investment partnership website (ironcapital.eu).

## Features

- **Apple Glass Design System** - Modern glass morphism UI with blur effects
- **Stock Screener** - Advanced filtering and sorting for investment research
- **Company Search** - Comprehensive company information and analysis
- **Responsive Design** - Optimized for all device sizes
- **TypeScript** - Full type safety and better developer experience

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **React Router** for client-side routing
- **Custom CSS** with glass morphism design system
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

The application uses a custom CSS design system with Apple Glass aesthetics:

- Glass morphism components with backdrop blur
- Responsive grid layouts
- Smooth animations and transitions
- Professional color palette

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

- Glass morphism components (`glass`, `glass-strong`)
- Responsive button styles (`btn-primary`, `btn-glass`)
- Form inputs with focus states
- Typography scale with responsive sizing
- Animation utilities (`fade-in`, `slide-up`)

## License

Private - Iron Capital Investment Partnership
