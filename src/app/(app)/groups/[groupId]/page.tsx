import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LeaderboardTable } from "@/components/groups/leaderboard-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Settings, Calendar, ArrowRight, Trophy } from "lucide-react";

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
    .order("date", { ascending: false });

  // Member count
  const { count: memberCount } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const finalizedCount = sessions?.filter((s) => s.status === "finalized").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            <Badge variant="secondary" className="capitalize">{membership.role}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {memberCount} {memberCount === 1 ? "member" : "members"} &middot; {finalizedCount} finalized {finalizedCount === 1 ? "session" : "sessions"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdminOrOwner && (
            <Button nativeButton={false} className="min-h-11 sm:min-h-9 gap-2" render={<Link href={`/groups/${groupId}/sessions/new`} />}>
              <Play className="h-4 w-4" />
              Start New Game
            </Button>
          )}
          <Button nativeButton={false} variant="outline" className="min-h-11 sm:min-h-9 gap-2" render={<Link href={`/groups/${groupId}/settings`} />}>
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Leaderboard</h2>
        </div>
        {leaderboard && leaderboard.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <LeaderboardTable rows={leaderboard} groupId={groupId} placeholderIds={placeholderIds} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No finalized sessions yet. Start a game to see the leaderboard.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Sessions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Recent Sessions</h2>
        </div>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/groups/${groupId}/sessions/${session.id}`}
                className="group flex items-center justify-between rounded-xl border p-4 hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground">{session.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      session.status === "finalized"
                        ? "default"
                        : session.status === "reconciling"
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize"
                  >
                    {session.status}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No sessions yet. Start a game to get going!</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
