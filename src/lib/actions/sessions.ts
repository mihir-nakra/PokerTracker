"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const groupId = formData.get("groupId") as string;
  const date = formData.get("date") as string;
  const notes = (formData.get("notes") as string) || null;
  const playerIds = formData.getAll("playerIds") as string[];

  // Create the session
  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      group_id: groupId,
      created_by: user.id,
      date,
      notes,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Add session players and create empty entries
  if (playerIds.length > 0) {
    await supabase.from("session_players").insert(
      playerIds.map((pid) => ({
        session_id: session.id,
        user_id: pid,
      }))
    );

    await supabase.from("entries").insert(
      playerIds.map((pid) => ({
        session_id: session.id,
        user_id: pid,
        total_buy_in: 0,
        cash_out: 0,
      }))
    );
  }

  redirect(`/groups/${groupId}/sessions/${session.id}`);
}

export async function updateSessionStatus(
  sessionId: string,
  groupId: string,
  status: "draft" | "reconciling" | "finalized"
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}/sessions/${sessionId}`);
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function addPlayerToSession(
  sessionId: string,
  userId: string,
  groupId: string
) {
  const supabase = await createClient();

  const { error: spError } = await supabase
    .from("session_players")
    .insert({ session_id: sessionId, user_id: userId });

  if (spError) return { error: spError.message };

  const { error: entryError } = await supabase
    .from("entries")
    .insert({ session_id: sessionId, user_id: userId, total_buy_in: 0, cash_out: 0 });

  if (entryError) return { error: entryError.message };

  revalidatePath(`/groups/${groupId}/sessions/${sessionId}`);
  return { success: true };
}

export async function removePlayerFromSession(
  sessionId: string,
  userId: string,
  groupId: string
) {
  const supabase = await createClient();

  const { error: entryError } = await supabase
    .from("entries")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  if (entryError) return { error: entryError.message };

  const { error: spError } = await supabase
    .from("session_players")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  if (spError) return { error: spError.message };

  revalidatePath(`/groups/${groupId}/sessions/${sessionId}`);
  return { success: true };
}

export async function deleteSession(sessionId: string, groupId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { error: error.message };

  redirect(`/groups/${groupId}`);
}
