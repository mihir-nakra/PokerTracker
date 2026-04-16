import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LeaderboardTable } from "@/components/groups/leaderboard-table";
import { Badge } from "@/components/ui/badge";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user!.id)
    .single();

  if (!membership) notFound();

  const isAdminOrOwner = membership.role === "owner" || membership.role === "admin";

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("group_id", groupId)
    .order("total_net", { ascending: false });

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

  // Fetch recent sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("group_id", groupId)
    .order("date", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            Your role: {membership.role}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdminOrOwner && (
            <Button nativeButton={false} className="min-h-11 sm:min-h-9" render={<Link href={`/groups/${groupId}/sessions/new`} />}>
              Start New Game
            </Button>
          )}
          <Button nativeButton={false} variant="outline" className="min-h-11 sm:min-h-9" render={<Link href={`/groups/${groupId}/settings`} />}>
            Settings
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Leaderboard</h2>
        {leaderboard && leaderboard.length > 0 ? (
          <LeaderboardTable rows={leaderboard} groupId={groupId} placeholderIds={placeholderIds} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No finalized sessions yet. Start a game to see the leaderboard.
          </p>
        )}
      </section>

      {/* Recent Sessions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/groups/${groupId}/sessions/${session.id}`}
                className="flex items-center justify-between rounded-md border p-3 min-h-11 hover:bg-accent/50 transition-colors"
              >
                <div>
                  <span className="font-medium">
                    {new Date(session.date).toLocaleDateString()}
                  </span>
                  {session.notes && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      — {session.notes}
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    session.status === "finalized"
                      ? "default"
                      : session.status === "reconciling"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {session.status}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        )}
      </section>
    </div>
  );
}
