# Wohnen in Paris

Apartment listings for German speakers in Paris. Built with Next.js 16, Supabase, and next-intl.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, React Server Components)
- **Database / Auth / Storage:** Supabase (Postgres + Row Level Security, magic-link auth, Storage for photos)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Forms:** react-hook-form + zod
- **i18n:** next-intl (default: `de`, also: `en`, `fr`)
- **Maps:** MapLibre GL + OSM tiles (no token needed)
- **Email:** Resend (transactional)
- **Hosting:** Vercel (free tier)
- **Package manager:** pnpm 11

## Local development

### Prerequisites

- Node.js (latest LTS)
- pnpm (`npm install -g pnpm`)

### Setup

```bash
git clone <repo-url>
cd wohnen-paris
pnpm install
cp .env.local .env.local   # already present, fill in your values
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.local` and fill in the real values:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `RESEND_API_KEY` | resend.com → API Keys |
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses |

## Project structure

```
app/
  [locale]/       # All pages live here; locale = de | en | fr
    layout.tsx    # Locale-aware root layout (fonts, Header, Footer)
    page.tsx      # Landing page
components/
  layout/         # Header, Footer
  landing/        # Landing page sections
  ui/             # shadcn/ui components
i18n/
  routing.ts      # Locale config (locales, defaultLocale)
  request.ts      # next-intl server config
messages/
  de.json         # German (default)
  en.json         # English
  fr.json         # French
lib/
  supabase/
    client.ts     # Browser Supabase client
    server.ts     # Server Supabase client (RSC-safe)
  utils.ts        # shadcn cn() helper
middleware.ts     # next-intl locale routing middleware
supabase/
  migrations/     # SQL migration files (created in M2)
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel project settings
4. Deploy

See `LAUNCH_CHECKLIST.md` (created after M6) for a complete pre-launch checklist.

## Milestones

- [x] **M1** — Skeleton: Next.js, Tailwind, shadcn, i18n, layout, landing page
- [ ] **M2** — Auth + schema: Supabase schema, RLS, magic-link login, profile page
- [ ] **M3** — Listings read path: browse, filters, listing detail, map, seed data
- [ ] **M4** — Listings write path: post-a-listing flow, photo upload, my-listings
- [ ] **M5** — Messaging: threads, send/reply, email notifications
- [ ] **M6** — Legal + admin + polish: Impressum/Datenschutz/AGB, cookie banner, admin page
