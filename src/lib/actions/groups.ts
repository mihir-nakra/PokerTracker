"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: group, error: lookupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (lookupError || !group) return { error: "Invalid invite code" };

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

  const { error } = await supabase
    .from("memberships")
    .insert({ user_id: user.id, group_id: group.id, role: "member" });

  if (error) return { error: error.message };

  redirect(`/groups/${group.id}`);
}

export async function updateGroup(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function removeMember(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}/settings`);
  return { success: true };
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}/settings`);
  return { success: true };
}

export async function regenerateInviteCode(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_new_invite_code", {
    group_id_input: groupId,
  });

  // Fallback: generate client-side and update
  if (error) {
    const newCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { error: updateError } = await supabase
      .from("groups")
      .update({ invite_code: newCode })
      .eq("id", groupId);
    if (updateError) return { error: updateError.message };
  }

  revalidatePath(`/groups/${groupId}/settings`);
  return { success: true };
}
