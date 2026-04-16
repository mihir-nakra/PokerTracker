import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CreateSessionForm } from "@/components/sessions/create-session-form";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify admin/owner
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user!.id)
    .single();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    notFound();
  }

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

  // Get the most recent session's players for "Same as last session"
  const { data: lastSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("group_id", groupId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  let lastSessionPlayerIds: string[] = [];
  if (lastSession) {
    const { data: lastPlayers } = await supabase
      .from("session_players")
      .select("user_id")
      .eq("session_id", lastSession.id);
    lastSessionPlayerIds = lastPlayers?.map((p) => p.user_id) ?? [];
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Start New Game</h1>
      <CreateSessionForm
        groupId={groupId}
        players={players}
        lastSessionPlayerIds={lastSessionPlayerIds}
      />
    </div>
  );
}
