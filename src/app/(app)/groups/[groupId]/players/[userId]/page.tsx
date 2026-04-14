import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StatsCards } from "@/components/stats/stats-cards";
import { CumulativeChart } from "@/components/stats/cumulative-chart";

export default async function PlayerStatsPage({
  params,
}: {
  params: Promise<{ groupId: string; userId: string }>;
}) {
  const { groupId, userId } = await params;
  const supabase = await createClient();

  // Verify current user is a member
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user!.id)
    .single();

  if (!membership) notFound();

  // Get player profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  // Get leaderboard stats for this player
  const { data: stats } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  // Get entries for cumulative chart (finalized sessions only, ordered by date)
  const { data: entries } = await supabase
    .from("entries")
    .select("net, sessions(date, status)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  // Filter to finalized sessions and compute cumulative data
  const chartData: { date: string; cumulative: number }[] = [];
  let cumulative = 0;

  const finalized = (entries ?? [])
    .filter((e) => {
      const session = e.sessions as unknown as { date: string; status: string } | null;
      return session?.status === "finalized";
    })
    .sort((a, b) => {
      const dateA = (a.sessions as unknown as { date: string }).date;
      const dateB = (b.sessions as unknown as { date: string }).date;
      return dateA.localeCompare(dateB);
    });

  for (const entry of finalized) {
    cumulative += Number(entry.net);
    chartData.push({
      date: (entry.sessions as unknown as { date: string }).date,
      cumulative: Math.round(cumulative * 100) / 100,
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">
        {profile.display_name ?? "Unknown"} — Stats
      </h1>

      {stats ? (
        <>
          <StatsCards
            totalNet={Number(stats.total_net)}
            sessionsPlayed={Number(stats.sessions_played)}
            avgNet={Number(stats.avg_net)}
            bestSession={Number(stats.best_session)}
            worstSession={Number(stats.worst_session)}
          />
          {chartData.length > 1 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Cumulative Earnings
              </h2>
              <CumulativeChart data={chartData} />
            </section>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">
          No finalized session data yet.
        </p>
      )}
    </div>
  );
}
