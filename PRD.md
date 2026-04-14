# Product Requirements Document (PRD)

## Product Name
Poker Tracker

---

## 1. Overview

Poker Tracker is a web application that allows groups of friends to track poker game earnings over time.

Users can:
- Create groups
- Run poker sessions (games)
- Enter buy-ins and cash-outs
- Automatically verify totals
- View long-term performance and graphs

The product emphasizes:
- Low friction data entry
- Accuracy via reconciliation
- Clear visibility into long-term results

---

## 2. Goals

### Primary Goals
- Minimize friction when logging a poker game
- Ensure accurate tracking of money in vs money out
- Provide clear visibility into who is up/down over time

### Non-Goals (MVP)
- Real-time gameplay tracking
- Tournament formats
- Payments/settlements (Venmo, etc.)
- Complex role systems
- Multi-table support

---

## 3. Core Concepts

### 3.1 Group
A persistent collection of users who play poker together.

Fields:
- id
- name
- owner_id
- created_at

---

### 3.2 Membership
Represents a user in a group.

Fields:
- id
- user_id
- group_id
- role (owner | admin | member)

---

### 3.3 Session (Game)
A single poker game instance within a group.

Fields:
- id
- group_id
- created_by
- date
- status (draft | reconciling | finalized)
- notes (optional)
- created_at

---

### 3.4 SessionPlayer
Represents a user who participated in a session.

Fields:
- id
- session_id
- user_id
- is_active (bool)

---

### 3.5 Entry
Represents a player’s financial data for a session.

Fields:
- id
- session_id
- user_id
- total_buy_in (number)
- cash_out (number)
- net (computed: cash_out - total_buy_in)
- created_at
- updated_at

---

## 4. User Roles & Permissions

### Owner
- Full access
- Manage group
- Promote/demote admins
- Create/edit/delete sessions
- Edit any entry
- Finalize/reopen sessions

### Admin
- Create sessions
- Edit sessions
- Select players
- Edit any entry
- Finalize/reopen sessions

### Member
- View group + sessions
- Join sessions
- Edit only their own entry (before finalized)

---

## 5. Core User Flows

### 5.1 Create Group

Flow:
1. User clicks "Create Group"
2. Inputs group name
3. Group is created
4. User becomes Owner

Post-condition:
- Invite link generated

---

### 5.2 Join Group

Flow:
1. User opens invite link
2. Logs in or signs up
3. Joins group as Member

---

### 5.3 Start New Session

Flow:
1. User clicks "Start New Game"
2. System auto-fills:
   - date = today
3. User selects players from group
   OR chooses "same as last session"
4. Session is created in "draft"

---

### 5.4 Enter Results (Player)

Flow:
1. User opens session
2. Sees list of players
3. For their row:
   - inputs total buy-in
   - inputs cash-out
4. System calculates net automatically

Rules:
- Only editable if session not finalized
- Members can only edit their own entry

---

### 5.5 Admin Entry Override

Flow:
- Admin can edit any player’s entry
- Used for missing players or corrections

---

### 5.6 Reconciliation (System Behavior)

At session level:

Compute:
- total_buy_ins = sum(all entries.total_buy_in)
- total_cash_outs = sum(all entries.cash_out)
- difference = total_cash_outs - total_buy_ins

Display:
- "Balanced" if difference == 0
- "Off by $X" otherwise
- "Waiting on N players" if entries missing

---

### 5.7 Finalize Session

Flow:
1. Admin clicks "Finalize"
2. Session status → finalized
3. Entries become read-only

Optional:
- Allow finalize even if not balanced

---

### 5.8 Reopen Session

Flow:
- Admin reopens finalized session
- Status → draft or reconciling
- Entries editable again

---

## 6. UI / UX Requirements

### 6.1 Groups Page
- List of groups
- "Create Group" button

---

### 6.2 Group Dashboard

Sections:
- Leaderboard (total net per user)
- Recent Sessions
- "Start New Game" button
- Members list

---

### 6.3 Session Page

For each player:
- Name
- Buy-in input
- Cash-out input
- Net (auto-calculated)

Session summary:
- Total buy-ins
- Total cash-outs
- Difference
- Status indicator

Actions:
- Finalize (admin only)

---

### 6.4 Player Stats Page

For each user:
- Total net earnings
- Sessions played
- Average per session
- Best session
- Worst session

Graphs:
- Cumulative earnings over time

---

## 7. Derived Data & Calculations

### Net per Entry
net = cash_out - total_buy_in

---

### Leaderboard
For each user:
sum(net across all finalized sessions in group)

---

### Sessions Played
Count of sessions where user has an entry

---

### Average Earnings
total_net / sessions_played

---

### Reconciliation
difference = total_cash_outs - total_buy_ins

---

## 8. Data Validation Rules

- total_buy_in ≥ 0
- cash_out ≥ 0
- Entries must be unique per (session_id, user_id)
- Cannot edit entries if session is finalized (except admin after reopen)
- Only admins/owners can finalize sessions

---

## 9. Edge Cases

- Missing entries → show “waiting on players”
- Non-participating members → excluded from session
- Small mismatch → allow finalize with warning
- Duplicate entry attempts → prevent via unique constraint
- Deleted user → keep historical data

---

## 10. MVP Scope

### Must Have
- Auth (simple)
- Groups
- Invite link
- Roles (owner/admin/member)
- Sessions
- Player selection per session
- Entry input (buy-in + cash-out)
- Reconciliation logic
- Finalize session
- Leaderboard
- Basic cumulative graph

---

### Nice to Have (Post-MVP)
- Rebuy breakdown UI
- Edit history
- Notifications (missing entries)
- Mobile optimization improvements
- CSV export

---

## 11. Suggested Tech Stack

Frontend:
- Next.js + React
- Tailwind

Backend / Database / Auth:
- Use my Supabase project via the connected MCP server
- Use Supabase for database, authentication, and any needed row-level security / backend support

Charts:
- Recharts or Chart.js

---

## 12. Success Metrics

- Time to log a session < 2 minutes
- % of sessions fully reconciled
- Weekly active groups
- Sessions created per group

---

## 13. Key UX Principles

- Minimize clicks to log a game
- Default everything possible
- Make errors visible (reconciliation)
- Allow flexibility (admin overrides)
- Keep mental model simple:
  - Who played?
  - What did they buy in?
  - What did they cash out?
  - Who’s up overall?