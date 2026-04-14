"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateEntry(
  entryId: string,
  data: { total_buy_in?: number; cash_out?: number },
  groupId: string,
  sessionId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("entries")
    .update(data)
    .eq("id", entryId);

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}/sessions/${sessionId}`);
  return { success: true };
}

export async function upsertEntry(
  sessionId: string,
  userId: string,
  data: { total_buy_in: number; cash_out: number },
  groupId: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from("entries").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      ...data,
    },
    { onConflict: "session_id,user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}/sessions/${sessionId}`);
  return { success: true };
}
