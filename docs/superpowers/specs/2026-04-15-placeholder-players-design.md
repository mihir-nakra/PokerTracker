# Placeholder Players Design

Allows group creators/admins to add named placeholder players to groups without requiring Supabase accounts. Placeholder players participate in sessions like real users (admins manage their entries). When a real user joins via invite, they can claim an unclaimed placeholder to inherit all historical stats.

## Database Changes

### `profiles` table — two new columns

- `is_placeholder` (boolean, default `false`) — distinguishes placeholder players from real users
- `created_by_group_id` (text, FK → groups.id, nullable) — tracks which group the placeholder was created for

### Placeholder profile creation

- `id`: app-generated UUID (not from Supabase Auth)
- `display_name`: set from admin input
- `avatar_url`: null
- `is_placeholder`: true
- `created_by_group_id`: the group's ID

### Existing tables — no schema changes

- `memberships`: placeholders get a row with `role: "member"`
- `session_players`: references `profiles.id` — works as-is
- `entries`: references `profiles.id` — works as-is
- `leaderboard` view: aggregates by `user_id` from `profiles` — works as-is

### Claim merge transaction

All in a single transaction:

1. Verify placeholder exists, `is_placeholder = true`, belongs to this group
2. Verify calling user is a member of this group
3. Verify no overlapping sessions between placeholder and real user (reject if conflict)
4. Reassign all `session_players` rows: `user_id` placeholder → real user
5. Reassign all `entries` rows: `user_id` placeholder → real user
6. Delete placeholder's membership row
7. Delete placeholder's profile row

### Supabase migration

Add columns to `profiles`:

```sql
ALTER TABLE profiles ADD COLUMN is_placeholder boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN created_by_group_id uuid REFERENCES groups(id) ON DELETE SET NULL;
```

RLS policy on `profiles` must allow inserts where `is_placeholder = true` by group admins/owners. The claim transaction and placeholder creation may need a service-role client or relaxed RLS policies.

## UI Changes

### Create Group page (`/groups/new`)

- Below the group name input, add a "Players" section:
  - Text input + "Add" button to add placeholder player names
  - List of added names with remove buttons
- On submit: create group, then create placeholder profiles + memberships for each name

### Group Settings / Members page

- Placeholder players show an "Unclaimed" badge in the member list
- "Add Player" button/section at the bottom with text input (same pattern as group creation)
- Admins/owners can delete placeholder players (confirmation warning if they have session history)

### Session Creation (`/groups/[groupId]/sessions/new`)

- No functional changes — placeholders appear in the player checklist via their memberships
- Visual: "Unclaimed" badge next to placeholder names in the checklist

### Session View / Entry Editing

- No functional changes — admins edit placeholder entries as usual
- Visual: "Unclaimed" badge next to placeholder names in entry rows

### Invite Join Flow (`/invite/[inviteCode]`)

After the user clicks "Join":

1. If group has unclaimed placeholders:
   - Show "Claim an existing player?" screen
   - List unclaimed placeholders with stats (total net, sessions played)
   - Each has a "Claim" button
   - "Skip — join as new player" option at the bottom
2. If "Claim" clicked → confirmation screen showing placeholder name + stats, "Confirm" / "Cancel"
3. On confirm → run merge transaction, redirect to group page
4. On skip or no placeholders → standard join (create membership, redirect to group page)

## Server Actions

### New: `createPlaceholderPlayer(groupId: string, displayName: string)`

- Creates a placeholder profile (app-generated UUID, `is_placeholder: true`, `created_by_group_id: groupId`)
- Creates a membership with `role: "member"`
- Requires caller to be admin/owner of the group

### New: `deletePlaceholderPlayer(profileId: string)`

- Deletes placeholder's entries, session_players, membership, and profile
- Requires caller to be admin/owner of the placeholder's group
- Should warn on client side if player has session history

### New: `claimPlaceholderPlayer(groupId: string, placeholderId: string)`

- Runs the merge transaction (see Database Changes section)
- Requires caller to be a member of the group
- Revalidates group page, session pages, and leaderboard

### Modified: `createGroup`

- After creating the group and owner membership, calls `createPlaceholderPlayer` for each name provided in the form

### Unchanged: `joinGroup`

- Still creates membership and redirects. Claim flow is a separate subsequent step.

## Edge Cases

- **Duplicate placeholder names**: Allowed — no uniqueness constraint. Distinct by ID.
- **Claim race condition**: Merge transaction checks placeholder still exists before proceeding.
- **Overlapping sessions**: If real user and placeholder both appear in the same session, claim is rejected with an error message.
- **Deleting placeholder with history**: Allowed with confirmation warning ("This player has X sessions. Deleting removes their entries and affects reconciliation.").
- **Leaderboard**: No changes needed. Placeholders appear naturally. After claim, real user inherits position.
- **RLS/permissions**: Placeholder creation bypasses Supabase Auth, so needs service-role client or relaxed RLS on `profiles` for placeholder inserts.
