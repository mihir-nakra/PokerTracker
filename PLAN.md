# Poker Tracker - Implementation Plan

## Context

Build a web app for friend groups to track poker game earnings over time. Users create groups, run poker sessions, enter buy-ins/cash-outs, verify totals via reconciliation, and view long-term performance graphs and leaderboards. The app deploys on Vercel with Supabase as the backend.

**Tech Stack:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (database, auth, RLS) via MCP server (project: `smipztsoyhafjefvabgv`)
- Supabase Auth: email/password + Google OAuth
- Recharts for graphs
- Vercel deployment

---

## Phase 1: Project Scaffolding

### 1.1 Initialize Next.js
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 1.2 Install Dependencies
```
npm install @supabase/supabase-js @supabase/ssr recharts
npx shadcn@latest init  # New York style, Zinc base, CSS variables
npx shadcn@latest add button card input label dialog table tabs badge avatar dropdown-menu sheet separator toast form select
```

### 1.3 Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://smipztsoyhafjefvabgv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.4 Supabase Client Utilities
- `src/lib/supabase/server.ts` - Server client using `createServerClient` from `@supabase/ssr` with `cookies()` (async in Next.js 15). Used in Server Components, Server Actions, Route Handlers.
- `src/lib/supabase/client.ts` - Browser client using `createBrowserClient` from `@supabase/ssr`. Used in Client Components.

### 1.5 Middleware (`src/middleware.ts`)
- Refreshes auth session via `supabase.auth.getUser()`
- Redirects unauthenticated users from protected routes (`/dashboard/*`, `/groups/*`) to `/login`
- Allows public paths: `/`, `/login`, `/signup`, `/auth/*`, `/invite/*`

### 1.6 TypeScript Types
- `src/lib/types/database.ts` - Generated via `npx supabase gen types typescript`
- `src/lib/types/index.ts` - App-level type aliases

**Verification:** `npm run dev` starts, Tailwind renders, Supabase client connects.

---

## Phase 2: Database Schema & RLS (via Supabase MCP)

### 2.1 Tables

**profiles** - Extends auth.users
- `id` (uuid, FK to auth.users, PK)
- `display_name` (text)
- `avatar_url` (text)
- `created_at` (timestamptz)

**groups**
- `id` (uuid, PK)
- `name` (text, not null)
- `owner_id` (uuid, FK to profiles)
- `invite_code` (text, unique, auto-generated 12-char hex)
- `created_at` (timestamptz)

**memberships**
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles)
- `group_id` (uuid, FK to groups)
- `role` (text: owner|admin|member)
- `created_at` (timestamptz)
- Unique constraint on (user_id, group_id)

**sessions**
- `id` (uuid, PK)
- `group_id` (uuid, FK to groups)
- `created_by` (uuid, FK to profiles)
- `date` (date, default today)
- `status` (text: draft|reconciling|finalized)
- `notes` (text, optional)
- `created_at` (timestamptz)

**session_players**
- `id` (uuid, PK)
- `session_id` (uuid, FK to sessions)
- `user_id` (uuid, FK to profiles)
- `is_active` (boolean)
- Unique constraint on (session_id, user_id)

**entries**
- `id` (uuid, PK)
- `session_id` (uuid, FK to sessions)
- `user_id` (uuid, FK to profiles)
- `total_buy_in` (numeric(10,2), >= 0)
- `cash_out` (numeric(10,2), >= 0)
- `net` (numeric(10,2), **generated column**: cash_out - total_buy_in)
- `created_at`, `updated_at` (timestamptz)
- Unique constraint on (session_id, user_id)

### 2.2 Triggers
- `handle_new_user()` - Auto-creates profile row when auth.users row is inserted (extracts display_name from metadata)
- `update_updated_at()` - Auto-updates `updated_at` on entries before update

### 2.3 Database View
- `leaderboard` view - Aggregates entries across finalized sessions per user/group: total_net, sessions_played, avg_net, best_session, worst_session

### 2.4 RLS Policies (summary)
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Anyone | Auto (trigger) | Own only | - |
| groups | Members + invite lookup | Auth users (own) | Owner | Owner |
| memberships | Group members | Own user_id | Owner/admin | Owner + self (leave) |
| sessions | Group members | Admin/owner | Admin/owner | Admin/owner (draft only) |
| session_players | Group members | Admin/owner | - | Admin/owner |
| entries | Group members | Own + non-finalized | Own or admin + non-finalized | - |

### 2.5 Indexes
- memberships(user_id), memberships(group_id)
- sessions(group_id)
- entries(session_id), entries(user_id)
- groups(invite_code)

**Verification:** Tables exist in Supabase, RLS blocks unauthorized access, generated types match schema.

---

## Phase 3: Authentication

### 3.1 Supabase Config
- Enable Email provider (default)
- Enable Google OAuth provider (requires Google Cloud Console credentials + redirect URL)

### 3.2 Route Handlers
- `src/app/auth/callback/route.ts` - OAuth callback, exchanges code for session, redirects to `/dashboard`
- `src/app/auth/confirm/route.ts` - Email confirmation, verifies OTP, redirects to `/dashboard`

### 3.3 Auth Pages
- `src/app/(auth)/layout.tsx` - Centered card layout, redirects to dashboard if already logged in
- `src/app/(auth)/login/page.tsx` - Email/password form + Google OAuth button. Reads `redirect` query param for post-login redirect (used by invite flow).
- `src/app/(auth)/signup/page.tsx` - Email/password/display name form + Google OAuth button

### 3.4 Server Actions (`src/lib/actions/auth.ts`)
- `signUp(formData)` - Creates account with display_name in metadata
- `signIn(formData)` - Password login, redirects to dashboard (or `redirect` param)
- `signInWithGoogle()` - OAuth flow, returns redirect URL
- `signOut()` - Signs out, redirects to `/login`

**Verification:** Sign up, confirm email, sign in (email + Google), sign out, middleware protection all work.

---

## Phase 4: App Shell & Routing

### 4.1 Route Structure
```
src/app/
  page.tsx                              -- Simple landing page with "Get Started"
  (auth)/login, signup, layout
  (app)/
    layout.tsx                          -- App shell (sidebar/nav)
    dashboard/page.tsx                  -- User's groups list
    groups/
      new/page.tsx                      -- Create group form
      [groupId]/
        page.tsx                        -- Group dashboard (leaderboard + sessions)
        settings/page.tsx               -- Members, invite link, roles
        sessions/
          new/page.tsx                  -- Create session, select players
          [sessionId]/page.tsx          -- Session detail + entry form
        players/[userId]/page.tsx       -- Player stats + graph
    profile/page.tsx                    -- Edit own profile
  invite/[inviteCode]/page.tsx          -- Invite link handler
  auth/callback, confirm (route handlers)
```

### 4.2 App Layout (`src/app/(app)/layout.tsx`)
- Server Component, fetches current user
- Sidebar with: logo, groups list, profile dropdown
- Mobile: hamburger sheet nav

### 4.3 Components
- `src/components/app-sidebar.tsx`
- `src/components/user-nav.tsx`
- `src/components/mobile-nav.tsx`

**Verification:** All routes render, navigation works, mobile nav toggles.

---

## Phase 5: Groups Feature

### 5.1 Server Actions (`src/lib/actions/groups.ts`)
- `createGroup(formData)` - Creates group + owner membership, redirects to group
- `joinGroup(inviteCode)` - Looks up group by invite_code, inserts member, redirects to group
- `updateGroup`, `deleteGroup`, `removeMember`, `updateMemberRole`, `regenerateInviteCode`

### 5.2 Pages
- **Dashboard** (`dashboard/page.tsx`) - Grid of group cards, "Create Group" button
- **Create Group** (`groups/new/page.tsx`) - Name input form
- **Group Dashboard** (`groups/[groupId]/page.tsx`) - Leaderboard table, recent sessions list, "Start New Game" button
- **Group Settings** (`groups/[groupId]/settings/page.tsx`) - Invite link (copy), member list, role management

### 5.3 Invite Link Flow
- URL format: `yourapp.com/invite/[inviteCode]`
- Not logged in: show group name + redirect to `/login?redirect=/invite/[inviteCode]`
- Logged in + not member: show "Join [Group]?" button
- Logged in + already member: redirect to group page

**Verification:** Create group, join via invite link (logged in + logged out flows), manage members/roles.

---

## Phase 6: Sessions & Entries (Core Feature)

### 6.1 Server Actions
- `src/lib/actions/sessions.ts` - `createSession`, `updateSessionStatus`, `deleteSession`
- `src/lib/actions/entries.ts` - `updateEntry`, `upsertEntry` (admin override)

### 6.2 Create Session (`groups/[groupId]/sessions/new/page.tsx`)
- Date picker (default today)
- Player selection: checkboxes for group members, "Select All", "Same as last session"
- Notes field (optional)
- Creates session + session_players + empty entries

### 6.3 Session Detail (`groups/[groupId]/sessions/[sessionId]/page.tsx`)
- **Entry table** (`src/components/sessions/session-view.tsx`): Each row = player name, buy-in input, cash-out input, net (auto-calc). Members edit own row only; admins/owners edit any row. Inline editing with auto-save on blur/Enter.
- **Reconciliation summary** (`src/components/sessions/reconciliation-summary.tsx`): Total buy-ins, total cash-outs, difference. "Balanced" (green) or "Off by $X" (red). "Waiting on N players" if entries incomplete.
- **Actions**: Finalize (admin/owner), Reopen (admin/owner)
- **UX**: Auto-focus first empty field, Tab between fields, save confirmation inline

### 6.4 Status Transitions
- `draft` -> `reconciling` (auto when all entries filled)
- `reconciling` -> `finalized` (admin clicks Finalize, warn if unbalanced)
- `finalized` -> `draft` (admin clicks Reopen)

**No real-time for MVP** - use `router.refresh()` after mutations.

**Verification:** Create session, enter buy-ins/cash-outs, reconciliation calculates correctly, finalize/reopen works, permissions enforced.

---

## Phase 7: Stats & Graphs

### 7.1 Leaderboard (`src/components/groups/leaderboard-table.tsx`)
- Rendered on group dashboard using `leaderboard` DB view
- Columns: Rank, Player (avatar + name), Total Net (green/red), Sessions, Avg/Session
- Rows link to player stats page

### 7.2 Player Stats (`groups/[groupId]/players/[userId]/page.tsx`)
- Stats cards: Total Net, Sessions Played, Avg/Session, Best Session, Worst Session
- Cumulative earnings graph

### 7.3 Cumulative Chart (`src/components/stats/cumulative-chart.tsx`)
- Client Component (Recharts needs DOM)
- Data computed server-side: running sum of net across finalized sessions ordered by date
- Recharts LineChart with XAxis (date), YAxis (dollars), Tooltip, ReferenceLine at y=0

**Verification:** Leaderboard ranks correctly, player stats accurate, chart renders with correct data, responsive on mobile.

---

## Phase 8: Polish & Deploy

### 8.1 Loading & Error States
- `loading.tsx` skeletons for dashboard, group, session pages
- `error.tsx` boundaries for the same
- `not-found.tsx` for invalid group/session IDs

### 8.2 Toast Notifications
- Entry saved, session finalized, invite link copied, errors

### 8.3 Mobile Optimization
- Session table -> stacked cards on small screens
- Sheet-based mobile nav
- 44px minimum touch targets

### 8.4 Landing Page (`src/app/page.tsx`)
- Simple hero with app name/description + "Get Started" button
- Redirects to dashboard if already logged in

### 8.5 Vercel Deployment
- Connect GitHub repo to Vercel
- Set env vars in Vercel dashboard
- Update `NEXT_PUBLIC_APP_URL` to production URL
- Update Supabase Auth redirect URLs for production domain
- Update Google OAuth redirect URI

**Verification:** Loading states show during navigation, errors caught gracefully, mobile layout works, Vercel deploy succeeds, production auth flows work.

---

## Key Architectural Decisions

| Decision | Approach |
|----------|----------|
| Data fetching | Server Components query Supabase directly |
| Mutations | Server Actions in `src/lib/actions/` with `revalidatePath()` |
| Auth in middleware | Server client with cookie bridge, `getUser()` call |
| Charts | Client Components (Recharts needs DOM) |
| Authorization | RLS at DB level (security) + UI role checks (UX) |
| Real-time | Not in MVP; `router.refresh()` after mutations |
| Money fields | `numeric(10,2)` to avoid floating-point issues |
| Net calculation | Generated column at DB level |
| Invite codes | Random hex on groups table, no separate invites table |

---

## File Structure

```
src/
  app/
    page.tsx                            -- Landing page
    layout.tsx                          -- Root layout
    globals.css
    (auth)/login, signup, layout
    (app)/
      layout.tsx                        -- App shell
      dashboard/page.tsx, loading.tsx
      groups/new/page.tsx
      groups/[groupId]/page.tsx, loading.tsx, settings/page.tsx
      groups/[groupId]/sessions/new/page.tsx
      groups/[groupId]/sessions/[sessionId]/page.tsx, loading.tsx
      groups/[groupId]/players/[userId]/page.tsx
      profile/page.tsx
    invite/[inviteCode]/page.tsx
    auth/callback/route.ts, confirm/route.ts
  components/
    ui/                                 -- shadcn/ui (auto-generated)
    app-sidebar.tsx
    user-nav.tsx
    mobile-nav.tsx
    groups/
      group-card.tsx
      leaderboard-table.tsx
      member-list.tsx
      invite-link-display.tsx
    sessions/
      create-session-form.tsx
      session-view.tsx
      entry-row.tsx
      reconciliation-summary.tsx
      session-status-badge.tsx
    stats/
      stats-cards.tsx
      cumulative-chart.tsx
  lib/
    supabase/server.ts, client.ts
    actions/auth.ts, groups.ts, sessions.ts, entries.ts
    types/database.ts, index.ts
    utils.ts
  middleware.ts
```
