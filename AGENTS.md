<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes: The Cinematic Chef

Bilingual (PT/EN) world-food app. See README.md for the full picture.

## Commands
- `npm run db:start` / `db:reset` / `db:test` (Supabase local, needs Docker; pgTAP tests)
- `npm test` (Vitest), `npm run typecheck`, `npm run lint`, `npm run build`
- `npm run db:types` after any migration (regenerates `src/lib/supabase/database.types.ts`)

## Rules that must hold
- Premium content is decided on the server and by RLS (`has_access()`), never in the client.
  Read recipe data with the user's session (`src/lib/supabase/server.ts`); the admin client
  (`src/lib/supabase/admin.ts`) bypasses RLS and is only for webhooks and account deletion.
- `subscriptions` is written only by verified payment webhooks (`src/lib/payments/*`).
- Secrets stay server-side (`src/lib/env.server.ts` imports `server-only`).
- Every UI string lives in `messages/pt.json` and `messages/en.json`; content text is JSONB
  `{"pt","en"}` with PT required. The admin panel (`/admin`) is Portuguese-only.
- New migrations go in `supabase/migrations/` with RLS enabled and explicit grants.

## Layout
- `src/app/[locale]/(explore)` globe + panel (static), `dish/[slug]` recipe page (with AI chef,
  favorites, passport stamp), `pricing`, `account`, `passport`, `vote`, `trips`, `privacy`,
  `terms`, `login`; `src/app/admin` separate root layout (dishes, places, trips, polls).
- `src/app/api/*` route handlers (search, checkout, checkout/bundle, billing-portal, video-token,
  chef, admin/translate, webhooks/{stripe,mercadopago,mux}); all user-facing ones are rate limited.
- Access to premium recipe content = `has_access()`: admin, free dish, active subscription, or a
  purchased trip (`purchases` + `bundle_dishes`).
