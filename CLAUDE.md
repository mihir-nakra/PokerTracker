# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint (v9 flat config)
```

No test framework is configured yet.

## Architecture

Full-stack **Next.js 16 + Supabase + React 19** poker session tracking app. Deployed to Vercel.

### App Router Structure

Two route groups with separate layouts:
- `(auth)` — login/signup pages, centered card layout, redirects authenticated users away
- `(app)` — protected pages with sidebar navigation, requires auth

Key routes:
- `/dashboard` — user's groups grid
- `/groups/[groupId]` — leaderboard + sessions list
- `/groups/[groupId]/sessions/[sessionId]` — session editor (buy-ins/cash-outs)
- `/invite/[inviteCode]` — join group via invite link

### Data Layer

- **Supabase** for auth (email/password + Google OAuth) and Postgres database
- Server client: `src/lib/supabase/server.ts` (async cookies via `@supabase/ssr`)
- Browser client: `src/lib/supabase/client.ts`
- Database types: `src/lib/types/database.ts` (generated from Supabase schema)

### Server Actions

All mutations live in `src/lib/actions/` as `"use server"` functions:
- `auth.ts` — signUp, signIn, signInWithGoogle, signOut
- `groups.ts` — group CRUD + invite code management
- `sessions.ts` — session creation & status transitions
- `entries.ts` — entry update & upsert

Actions return `{ error: string }` or redirect on success, and call `revalidatePath` after mutations.

### Auth & Middleware

`src/middleware.ts` refreshes Supabase auth sessions on every request and protects all routes except `/`, `/login`, `/signup`, `/auth/*`, `/invite/*`. Unauthenticated users are redirected to `/login`.

### Database Schema

Six tables: `profiles`, `groups`, `memberships`, `sessions`, `session_players`, `entries`. One view: `leaderboard` (aggregated player stats per group from finalized sessions). The `entries` table has a computed `net` column (cash_out - total_buy_in).

### UI

- **shadcn/ui** components in `src/components/ui/`
- **Tailwind v4** with OKLCH CSS variables for light/dark theming
- **Recharts** for cumulative earnings charts
- **Sonner** for toast notifications
- Feature components organized by domain: `components/groups/`, `components/sessions/`, `components/stats/`

### Environment Variables

All three are `NEXT_PUBLIC_` prefixed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (used for auth redirect URLs)

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).
