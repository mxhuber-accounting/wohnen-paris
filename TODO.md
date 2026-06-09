# TODO — Deferred to after launch

## Post-launch features

- **Saved searches / email alerts** — notify users when new listings match their filters
- **London expansion** — schema is multi-city-ready (every listing has `city_id`); add London when ready
- **Paid tiers / featured listings** — promoted placement for landlords
- **Reviews / ratings** — rate landlords and tenants after a tenancy
- **Calendar / booking flow** — in-app scheduling of viewings
- **SCHUFA / ID verification** — optional trust badge for verified users
- **Native mobile apps** — iOS + Android (or PWA first)

## Technical debt / improvements

- Add `next-safe-action` for type-safe server actions when forms get complex
- Set up Sentry for error monitoring before public launch
- Add Playwright e2e tests for the critical flows (post listing, send message, login)
- Lighthouse CI in GitHub Actions
- Image CDN (Cloudflare Images or Supabase Storage transformations) for automatic resizing
- Add `robots.txt` and `sitemap.xml` generation
- Add OpenGraph images per listing for social sharing

## Content

- Refine German copy with a native speaker review
- Have a lawyer review `/impressum`, `/datenschutz`, `/agb` before public launch
- Add a proper logo / wordmark (currently text-only)
