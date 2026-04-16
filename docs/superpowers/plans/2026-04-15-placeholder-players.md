# Placeholder Players Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow group admins to add named placeholder players (no account required) that participate in sessions and can later be claimed by real users who join via invite link.

**Architecture:** Add `is_placeholder` and `created_by_group_id` columns to the existing `profiles` table. Placeholder profiles get memberships and participate in sessions identically to real users. When a real user claims a placeholder, all references (session_players, entries, memberships) are reassigned to the real user's ID and the placeholder profile is deleted.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + Auth), React 19, shadcn/ui, Tailwind v4

---

### Task 1: Database Migration — Add placeholder columns to profiles

**Files:**
- Modify (via Supabase MCP): `profiles` table in Supabase database
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Apply migration to add columns**

Run this SQL via the Supabase MCP `apply_migration` tool:

```sql
ALTER TABLE profiles ADD COLUMN is_placeholder boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN created_by_group_id uuid REFERENCES groups(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Update TypeScript database types**

In `src/lib/types/database.ts`, update the `profiles` table type definitions:

```typescript
profiles: {
  Row: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    is_placeholder: boolean;
    created_by_group_id: string | null;
    created_at: string;
  };
  Insert: {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
    is_placeholder?: boolean;
    created_by_group_id?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    is_placeholder?: boolean;
    created_by_group_id?: string | null;
    created_at?: string;
  };
};
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat: add is_placeholder and created_by_group_id columns to profiles"
```

---

### Task 2: Server Actions — Placeholder CRUD and claim logic

**Files:**
- Create: `src/lib/actions/players.ts`
- Modify: `src/lib/actions/groups.ts`

- [ ] **Step 1: Create `src/lib/actions/players.ts` with placeholder actions**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPlaceholderPlayer(groupId: string, displayName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify caller is admin/owner of this group
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Not authorized" };
  }

  const placeholderId = crypto.randomUUID();

  const { error: profileError } = await supabase.from("profiles").insert({
    id: placeholderId,
    display_name: displayName.trim(),
    is_placeholder: true,
    created_by_group_id: groupId,
  });

  if (profileError) return { error: profileError.message };

  const { error: membershipError } = await supabase.from("memberships").insert({
    user_id: placeholderId,
    group_id: groupId,
    role: "member",
  });

  if (membershipError) return { error: membershipError.message };

  revalidatePath(`/groups/${groupId}/settings`);
  return { success: true, playerId: placeholderId };
}

export async function deletePlaceholderPlayer(profileId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify caller is admin/owner
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Not authorized" };
  }

  // Verify target is a placeholder
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_placeholder, created_by_group_id")
    .eq("id", profileId)
    .single();

  if (!profile || !profile.is_placeholder || profile.created_by_group_id !== groupId) {
    return { error: "Invalid placeholder player" };
  }

  // Delete entries, session_players, membership, then profile (order matters for FK constraints)
  await supabase.from("entries").delete().eq("user_id", profileId);
  await supabase.from("session_players").delete().eq("user_id", profileId);
  await supabase.from("memberships").delete().eq("user_id", profileId).eq("group_id", groupId);
  await supabase.from("profiles").delete().eq("id", profileId);

  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function getUnclaimedPlaceholders(groupId: string) {
  const supabase = await createClient();

  const { data: placeholders } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("is_placeholder", true)
    .eq("created_by_group_id", groupId);

  if (!placeholders || placeholders.length === 0) return [];

  // Get stats for each placeholder from the leaderboard view
  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("user_id, total_net, sessions_played")
    .eq("group_id", groupId)
    .in("user_id", placeholders.map((p) => p.id));

  const statsMap = new Map(
    leaderboard?.map((l) => [l.user_id, { totalNet: l.total_net, sessionsPlayed: l.sessions_played }]) ?? []
  );

  return placeholders.map((p) => ({
    id: p.id,
    displayName: p.display_name ?? "Unknown",
    totalNet: statsMap.get(p.id)?.totalNet ?? 0,
    sessionsPlayed: statsMap.get(p.id)?.sessionsPlayed ?? 0,
  }));
}

export async function claimPlaceholderPlayer(groupId: string, placeholderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify caller is a member of this group
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "You are not a member of this group" };

  // Verify placeholder exists and is valid
  const { data: placeholder } = await supabase
    .from("profiles")
    .select("id, is_placeholder, created_by_group_id")
    .eq("id", placeholderId)
    .single();

  if (!placeholder || !placeholder.is_placeholder || placeholder.created_by_group_id !== groupId) {
    return { error: "Invalid placeholder player" };
  }

  // Check for overlapping sessions (real user and placeholder both in the same session)
  const { data: placeholderSessions } = await supabase
    .from("session_players")
    .select("session_id")
    .eq("user_id", placeholderId);

  if (placeholderSessions && placeholderSessions.length > 0) {
    const sessionIds = placeholderSessions.map((s) => s.session_id);
    const { data: conflicts } = await supabase
      .from("session_players")
      .select("id")
      .eq("user_id", user.id)
      .in("session_id", sessionIds);

    if (conflicts && conflicts.length > 0) {
      return { error: "Cannot claim: you already participated in sessions this player was in" };
    }
  }

  // Reassign all session_players from placeholder to real user
  await supabase
    .from("session_players")
    .update({ user_id: user.id })
    .eq("user_id", placeholderId);

  // Reassign all entries from placeholder to real user
  await supabase
    .from("entries")
    .update({ user_id: user.id })
    .eq("user_id", placeholderId);

  // Delete placeholder's membership (real user already has one)
  await supabase
    .from("memberships")
    .delete()
    .eq("user_id", placeholderId)
    .eq("group_id", groupId);

  // Delete placeholder profile
  await supabase.from("profiles").delete().eq("id", placeholderId);

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/settings`);
  return { success: true };
}
```

- [ ] **Step 2: Modify `createGroup` in `src/lib/actions/groups.ts` to accept player names**

Change the `createGroup` function (lines 7-31) to also read `playerNames` from the form data and create placeholders after group creation:

```typescript
export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const playerNames = formData.getAll("playerNames") as string[];

  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // Create owner membership
  await supabase
    .from("memberships")
    .insert({ user_id: user.id, group_id: group.id, role: "owner" });

  // Create placeholder players
  for (const playerName of playerNames) {
    const trimmed = playerName.trim();
    if (!trimmed) continue;
    const placeholderId = crypto.randomUUID();
    await supabase.from("profiles").insert({
      id: placeholderId,
      display_name: trimmed,
      is_placeholder: true,
      created_by_group_id: group.id,
    });
    await supabase.from("memberships").insert({
      user_id: placeholderId,
      group_id: group.id,
      role: "member",
    });
  }

  redirect(`/groups/${group.id}`);
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/players.ts src/lib/actions/groups.ts
git commit -m "feat: add placeholder player CRUD and claim server actions"
```

---

### Task 3: Create Group UI — Add player name inputs

**Files:**
- Modify: `src/app/(app)/groups/new/page.tsx`

- [ ] **Step 1: Update the Create Group page to include player name inputs**

Replace the full content of `src/app/(app)/groups/new/page.tsx`:

```typescript
"use client";

import { createGroup } from "@/lib/actions/groups";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export default function NewGroupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  function addPlayer() {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayerNames((prev) => [...prev, trimmed]);
    setNewPlayerName("");
  }

  function removePlayer(index: number) {
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.delete("playerNames");
    playerNames.forEach((name) => formData.append("playerNames", name));
    const result = await createGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create a Group</h1>
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Friday Night Poker"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Players (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Add players who don&apos;t have accounts yet. They can claim their profile later.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPlayer();
                    }
                  }}
                  placeholder="Player name"
                />
                <Button type="button" variant="outline" onClick={addPlayer}>
                  Add
                </Button>
              </div>
              {playerNames.length > 0 && (
                <div className="space-y-1">
                  {playerNames.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removePlayer(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build and test in browser**

Run: `npm run build`
Expected: Build succeeds.

Start dev server: `npm run dev`
Test: Navigate to `/groups/new`, add a few player names, create a group, verify redirect to group page.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/groups/new/page.tsx
git commit -m "feat: add placeholder player inputs to group creation form"
```

---

### Task 4: Group Settings UI — Show placeholder badges and add player form

**Files:**
- Modify: `src/app/(app)/groups/[groupId]/settings/page.tsx`
- Modify: `src/components/groups/member-list.tsx`

- [ ] **Step 1: Update settings page to pass `isPlaceholder` flag with each member**

In `src/app/(app)/groups/[groupId]/settings/page.tsx`, update the memberships query and member mapping to include placeholder info. Replace the memberships fetch and mapping (lines 35-46):

```typescript
  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, user_id, role, profiles(id, display_name, avatar_url, is_placeholder)")
    .eq("group_id", groupId);

  const members =
    memberships?.map((m) => ({
      userId: m.user_id,
      role: m.role,
      displayName: (m.profiles as unknown as { display_name: string | null })?.display_name ?? "Unknown",
      avatarUrl: (m.profiles as unknown as { avatar_url: string | null })?.avatar_url,
      isPlaceholder: (m.profiles as unknown as { is_placeholder: boolean })?.is_placeholder ?? false,
    })) ?? [];
```

Then add the `AddPlayerForm` import at the top and render it below the MemberList (after the closing `</section>` of the Members section, before the closing `</div>`):

```typescript
import { AddPlayerForm } from "@/components/groups/add-player-form";
```

And add this section after the Members section (after line 72):

```tsx
      {isAdminOrOwner && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Add Player</h2>
          <AddPlayerForm groupId={groupId} />
        </section>
      )}
```

- [ ] **Step 2: Update MemberList to show placeholder badges and delete button**

In `src/components/groups/member-list.tsx`, update the `Member` interface and component to handle placeholders:

Update the `Member` interface (lines 16-21):

```typescript
interface Member {
  userId: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  isPlaceholder: boolean;
}
```

Add the import for `deletePlaceholderPlayer` at the top (alongside existing imports from `@/lib/actions/groups`):

```typescript
import { deletePlaceholderPlayer } from "@/lib/actions/players";
```

Add a handler function inside the component, after `handleRemove` (after line 54):

```typescript
  async function handleDeletePlaceholder(userId: string) {
    if (!confirm("Delete this placeholder player? This will remove all their session data.")) return;
    const result = await deletePlaceholderPlayer(userId, groupId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Player removed");
    }
  }
```

Inside the member row, after the display name `<span>` (line 79), add the placeholder badge:

```tsx
              {member.isPlaceholder && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Unclaimed
                </Badge>
              )}
```

In the actions area (lines 86-112), add a delete button for placeholder members. Replace the entire actions `<div>` (lines 86-113):

```tsx
            <div className="flex items-center gap-2">
              {canManage && !isOwner && !isSelf ? (
                <>
                  {member.isPlaceholder ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeletePlaceholder(member.userId)}
                    >
                      Delete
                    </Button>
                  ) : (
                    <>
                      <Select
                        defaultValue={member.role}
                        onValueChange={(v) => v && handleRoleChange(member.userId, String(v))}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">admin</SelectItem>
                          <SelectItem value="member">member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleRemove(member.userId)}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Badge variant="secondary">{member.role}</Badge>
              )}
            </div>
```

- [ ] **Step 3: Create the AddPlayerForm component**

Create `src/components/groups/add-player-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlaceholderPlayer } from "@/lib/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddPlayerFormProps {
  groupId: string;
}

export function AddPlayerForm({ groupId }: AddPlayerFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    const result = await createPlaceholderPlayer(groupId, trimmed);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${trimmed}`);
      setName("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="Player name"
      />
      <Button onClick={handleAdd} disabled={loading || !name.trim()}>
        {loading ? "Adding..." : "Add"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Verify build and test in browser**

Run: `npm run build`
Expected: Build succeeds.

Test in browser:
1. Go to a group's settings page
2. Verify placeholder members show "Unclaimed" badge
3. Verify "Add Player" section appears for admins/owners
4. Add a placeholder player and verify it appears in the list
5. Delete a placeholder player and verify it disappears

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/groups/[groupId]/settings/page.tsx src/components/groups/member-list.tsx src/components/groups/add-player-form.tsx
git commit -m "feat: add placeholder player management to group settings"
```

---

### Task 5: Session Creation — Show placeholder badge in player checklist

**Files:**
- Modify: `src/app/(app)/groups/[groupId]/sessions/new/page.tsx`
- Modify: `src/components/sessions/create-session-form.tsx`

- [ ] **Step 1: Pass `isPlaceholder` flag from session creation page**

In `src/app/(app)/groups/[groupId]/sessions/new/page.tsx`, update the memberships query and player mapping (lines 30-40):

```typescript
  // Get group members
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, profiles(id, display_name, is_placeholder)")
    .eq("group_id", groupId);

  const players =
    memberships?.map((m) => ({
      id: m.user_id,
      displayName:
        (m.profiles as unknown as { display_name: string | null })?.display_name ?? "Unknown",
      isPlaceholder:
        (m.profiles as unknown as { is_placeholder: boolean })?.is_placeholder ?? false,
    })) ?? [];
```

- [ ] **Step 2: Update CreateSessionForm to show badge**

In `src/components/sessions/create-session-form.tsx`, update the player type in the interface (line 12):

```typescript
  players: { id: string; displayName: string; isPlaceholder: boolean }[];
```

Add a Badge import at the top:

```typescript
import { Badge } from "@/components/ui/badge";
```

Update the player label in the checklist (lines 109-121) to show the badge:

```tsx
              {players.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.has(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="h-4 w-4"
                  />
                  <span>{player.displayName}</span>
                  {player.isPlaceholder && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Unclaimed
                    </Badge>
                  )}
                </label>
              ))}
```

- [ ] **Step 3: Verify build and test in browser**

Run: `npm run build`
Expected: Build succeeds.

Test: Go to session creation for a group with placeholder players. Verify placeholders appear with "Unclaimed" badge.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/groups/[groupId]/sessions/new/page.tsx src/components/sessions/create-session-form.tsx
git commit -m "feat: show unclaimed badge for placeholder players in session creation"
```

---

### Task 6: Session View — Show placeholder badge in entry rows

**Files:**
- Modify: `src/app/(app)/groups/[groupId]/sessions/[sessionId]/page.tsx`
- Modify: `src/components/sessions/session-view.tsx`
- Modify: `src/components/sessions/entry-row.tsx`

- [ ] **Step 1: Pass `isPlaceholder` from session detail page**

In `src/app/(app)/groups/[groupId]/sessions/[sessionId]/page.tsx`, update the entries query (line 38) to include `is_placeholder`:

```typescript
  const { data: entries } = await supabase
    .from("entries")
    .select("*, profiles(display_name, avatar_url, is_placeholder)")
    .eq("session_id", sessionId);
```

Update the mapping (lines 42-52) to include `isPlaceholder`:

```typescript
  const entriesWithProfiles =
    entries?.map((e) => ({
      id: e.id,
      userId: e.user_id,
      displayName:
        (e.profiles as unknown as { display_name: string | null })?.display_name ?? "Unknown",
      avatarUrl: (e.profiles as unknown as { avatar_url: string | null })?.avatar_url,
      isPlaceholder: (e.profiles as unknown as { is_placeholder: boolean })?.is_placeholder ?? false,
      totalBuyIn: Number(e.total_buy_in),
      cashOut: Number(e.cash_out),
      net: Number(e.net),
    })) ?? [];
```

- [ ] **Step 2: Update SessionView and EntryRow types**

In `src/components/sessions/session-view.tsx`, add `isPlaceholder` to `EntryData` (lines 12-20):

```typescript
interface EntryData {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isPlaceholder: boolean;
  totalBuyIn: number;
  cashOut: number;
  net: number;
}
```

In `src/components/sessions/entry-row.tsx`, add `isPlaceholder` to the entry type in `EntryRowProps` (lines 13-20):

```typescript
  entry: {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    isPlaceholder: boolean;
    totalBuyIn: number;
    cashOut: number;
    net: number;
  };
```

Add a Badge import at the top of `entry-row.tsx`:

```typescript
import { Badge } from "@/components/ui/badge";
```

After the display name `<span>` (line 66), add the badge:

```tsx
        <span className="font-medium text-sm">{entry.displayName}</span>
        {entry.isPlaceholder && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Unclaimed
          </Badge>
        )}
```

- [ ] **Step 3: Verify build and test in browser**

Run: `npm run build`
Expected: Build succeeds.

Test: View a session that includes placeholder players. Verify "Unclaimed" badge appears next to their names.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/groups/[groupId]/sessions/[sessionId]/page.tsx src/components/sessions/session-view.tsx src/components/sessions/entry-row.tsx
git commit -m "feat: show unclaimed badge for placeholder players in session view"
```

---

### Task 7: Invite Claim Flow — Post-join claim UI

**Files:**
- Create: `src/app/invite/[inviteCode]/claim/page.tsx`
- Modify: `src/app/invite/[inviteCode]/page.tsx`

- [ ] **Step 1: Modify invite page to redirect to claim page after joining**

Replace the full content of `src/app/invite/[inviteCode]/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { joinGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  // Look up group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in — redirect to login with redirect back here
  if (!user) {
    redirect(`/login?redirect=/invite/${inviteCode}`);
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (existing) {
    redirect(`/groups/${group.id}`);
  }

  // Check if there are unclaimed placeholders
  const { data: placeholders } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_placeholder", true)
    .eq("created_by_group_id", group.id);

  const hasPlaceholders = placeholders && placeholders.length > 0;

  // Show join prompt
  async function handleJoin() {
    "use server";
    await joinGroup(inviteCode);
    // After joining, redirect to claim page if there are placeholders
    if (hasPlaceholders) {
      redirect(`/invite/${inviteCode}/claim`);
    }
    // Otherwise joinGroup already redirects to group page
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join {group.name}?</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this poker group.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <form action={handleJoin}>
            <Button type="submit" size="lg">
              Join Group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create the claim page**

Create `src/app/invite/[inviteCode]/claim/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUnclaimedPlaceholders } from "@/lib/actions/players";
import { ClaimPlayerUI } from "./claim-player-ui";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/invite/${inviteCode}`);
  }

  // Look up group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    redirect("/dashboard");
  }

  // Verify user is a member (they should have just joined)
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (!membership) {
    redirect(`/invite/${inviteCode}`);
  }

  const placeholders = await getUnclaimedPlaceholders(group.id);

  if (placeholders.length === 0) {
    redirect(`/groups/${group.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ClaimPlayerUI
        placeholders={placeholders}
        groupId={group.id}
        groupName={group.name}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create the ClaimPlayerUI client component**

Create `src/app/invite/[inviteCode]/claim/claim-player-ui.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimPlaceholderPlayer } from "@/lib/actions/players";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface Placeholder {
  id: string;
  displayName: string;
  totalNet: number;
  sessionsPlayed: number;
}

interface ClaimPlayerUIProps {
  placeholders: Placeholder[];
  groupId: string;
  groupName: string;
}

export function ClaimPlayerUI({ placeholders, groupId, groupName }: ClaimPlayerUIProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<Placeholder | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClaim(placeholder: Placeholder) {
    setLoading(true);
    const result = await claimPlaceholderPlayer(groupId, placeholder.id);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      setConfirming(null);
    } else {
      toast.success(`Claimed ${placeholder.displayName}'s profile`);
      router.push(`/groups/${groupId}`);
    }
  }

  function handleSkip() {
    router.push(`/groups/${groupId}`);
  }

  // Confirmation screen
  if (confirming) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Claim {confirming.displayName}?</CardTitle>
          <CardDescription>
            You will inherit all of this player&apos;s history and stats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sessions played</span>
              <span className="font-medium">{confirming.sessionsPlayed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total net</span>
              <span className={`font-medium ${confirming.totalNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                {confirming.totalNet >= 0 ? "+" : ""}${confirming.totalNet.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirming(null)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleClaim(confirming)}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Confirm"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Placeholder selection screen
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Welcome to {groupName}!</CardTitle>
        <CardDescription>
          Are you one of these existing players? Claim your profile to inherit your stats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {placeholders.map((p) => (
          <button
            key={p.id}
            onClick={() => setConfirming(p)}
            className="w-full flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors text-left"
          >
            <span className="font-medium">{p.displayName}</span>
            <span className="text-sm text-muted-foreground">
              {p.sessionsPlayed} {p.sessionsPlayed === 1 ? "session" : "sessions"}
            </span>
          </button>
        ))}
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleSkip}
        >
          Skip — join as new player
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Verify build and test in browser**

Run: `npm run build`
Expected: Build succeeds.

Test the full invite flow:
1. Create a group with placeholder players
2. Copy the invite link
3. In an incognito window, sign up as a new user
4. Visit the invite link
5. Click "Join Group" — should redirect to claim page
6. Verify placeholder list with stats is shown
7. Click "Claim" on a placeholder — verify confirmation screen with stats
8. Confirm — verify redirect to group page
9. Verify the claimed player's sessions/entries now belong to the new user
10. Verify the placeholder no longer appears in the member list

- [ ] **Step 5: Commit**

```bash
git add src/app/invite/[inviteCode]/page.tsx src/app/invite/[inviteCode]/claim/page.tsx src/app/invite/[inviteCode]/claim/claim-player-ui.tsx
git commit -m "feat: add post-join claim flow for placeholder players"
```

---

### Task 8: Leaderboard — Show placeholder badge

**Files:**
- Modify: `src/app/(app)/groups/[groupId]/page.tsx`
- Modify: `src/components/groups/leaderboard-table.tsx`

- [ ] **Step 1: Read leaderboard-table component**

Read `src/components/groups/leaderboard-table.tsx` to understand its current props and rendering.

- [ ] **Step 2: Update group page to pass `isPlaceholder` in leaderboard data**

In `src/app/(app)/groups/[groupId]/page.tsx`, after fetching the leaderboard data, also fetch which users are placeholders. After the leaderboard query (lines 40-44), add:

```typescript
  // Mark which leaderboard entries are placeholders
  const leaderboardUserIds = leaderboard?.map((l) => l.user_id) ?? [];
  const { data: placeholderProfiles } = leaderboardUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id")
        .eq("is_placeholder", true)
        .in("id", leaderboardUserIds)
    : { data: [] };

  const placeholderIds = new Set(placeholderProfiles?.map((p) => p.id) ?? []);
```

Pass `placeholderIds` to the `LeaderboardTable` component:

```tsx
  <LeaderboardTable leaderboard={leaderboard ?? []} placeholderIds={placeholderIds} />
```

- [ ] **Step 3: Update LeaderboardTable to show badge**

In `src/components/groups/leaderboard-table.tsx`, add a `placeholderIds` prop and show "Unclaimed" badge next to placeholder names. The exact edits depend on the component's current structure (read in step 1), but add Badge import and render the badge after the player name for any user whose ID is in `placeholderIds`.

- [ ] **Step 4: Verify build and test in browser**

Run: `npm run build`
Expected: Build succeeds.

Test: View a group with finalized sessions that include placeholder players. Verify "Unclaimed" badge on the leaderboard.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/groups/[groupId]/page.tsx src/components/groups/leaderboard-table.tsx
git commit -m "feat: show unclaimed badge for placeholder players on leaderboard"
```
