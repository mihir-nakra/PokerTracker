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
    .in(
      "user_id",
      placeholders.map((p) => p.id)
    );

  const statsMap = new Map(
    leaderboard?.map((l) => [
      l.user_id,
      { totalNet: l.total_net, sessionsPlayed: l.sessions_played },
    ]) ?? []
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

  // Check for overlapping sessions
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
