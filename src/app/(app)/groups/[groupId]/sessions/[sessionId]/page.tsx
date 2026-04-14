import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SessionView } from "@/components/sessions/session-view";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; sessionId: string }>;
}) {
  const { groupId, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  // Verify membership and get role
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user!.id)
    .single();

  if (!membership) notFound();

  // Fetch entries with player profiles
  const { data: entries } = await supabase
    .from("entries")
    .select("*, profiles(display_name, avatar_url)")
    .eq("session_id", sessionId);

  const entriesWithProfiles =
    entries?.map((e) => ({
      id: e.id,
      userId: e.user_id,
      displayName:
        (e.profiles as unknown as { display_name: string | null })?.display_name ?? "Unknown",
      avatarUrl: (e.profiles as unknown as { avatar_url: string | null })?.avatar_url,
      totalBuyIn: Number(e.total_buy_in),
      cashOut: Number(e.cash_out),
      net: Number(e.net),
    })) ?? [];

  const isAdminOrOwner = membership.role === "owner" || membership.role === "admin";

  return (
    <SessionView
      session={session}
      entries={entriesWithProfiles}
      groupId={groupId}
      currentUserId={user!.id}
      isAdminOrOwner={isAdminOrOwner}
    />
  );
}
