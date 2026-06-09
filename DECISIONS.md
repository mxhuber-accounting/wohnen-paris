# Decisions

Deviations from the original brief or non-obvious choices, logged for traceability.

## Stack

| Decision | Choice | Reason |
|---|---|---|
| Next.js version | 16.2.7 (latest as of Jun 2026) | `create-next-app` defaulted to this; App Router is stable and unchanged |
| Supabase client | `@supabase/ssr` + `@supabase/supabase-js` | Recommended pattern for Next.js App Router (server + client separation) |
| Fonts | Inter (body) + Fraunces (headings) | Both on Google Fonts; Fraunces is a strong optical-size serif, matches the "tasteful serif" brief. Loaded via `next/font/google` for zero layout shift. |
| Accent color | `#1D4ED8` (Tailwind blue-700) | Trustworthy, readable, unambiguous. Paris associations without cliché. Revisit if brand identity evolves. |
| FAQ component | `<details>/<summary>` | No JS needed, fully accessible, progressive enhancement. Avoids a client component for static content. |
| pnpm build approvals | `pnpm-workspace.yaml` `allowBuilds` | pnpm 11 requires explicit approval of build scripts. Approved: sharp, unrs-resolver, @parcel/watcher, @swc/core, msw. |
| Tailwind CSS version | v4 (bundled with Next.js 16) | Config lives in CSS (`globals.css`) instead of `tailwind.config.js`. |

## Locale routing

`localePrefix: 'as-needed'` means:
- `/` → German (default, no prefix)
- `/en/` → English
- `/fr/` → French

This keeps German URLs clean (no `/de/` prefix), which is correct since the primary audience is German.
