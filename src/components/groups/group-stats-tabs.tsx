"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/groups/leaderboard-table";
import { GroupWinningsChart } from "@/components/groups/group-winnings-chart";
import { Trophy, TrendingUp, BarChart3 } from "lucide-react";

interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_net: number;
  sessions_played: number;
  avg_net: number;
}

interface PlayerSeries {
  userId: string;
  displayName: string;
  data: { date: string; cumulative: number }[];
}

interface GroupStats {
  totalSessions: number;
  totalPlayers: number;
  totalBuyIn: number;
  totalCashOut: number;
  totalEntries: number;
  avgBuyInPerSession: number;
  avgBuyInPerPlayer: number;
  avgPlayersPerSession: number;
  avgBuyInPerEntry: number;
  biggestPot: number;
  biggestPotDate: string;
}

interface GroupStatsTabsProps {
  leaderboard: LeaderboardRow[];
  groupId: string;
  placeholderIds: Set<string>;
  chartPlayers: PlayerSeries[];
  currentUserId: string;
  groupStats: GroupStats;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border p-4 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function GroupStatsTabs({
  leaderboard,
  groupId,
  placeholderIds,
  chartPlayers,
  currentUserId,
  groupStats,
}: GroupStatsTabsProps) {
  return (
    <Tabs defaultValue="leaderboard">
      <TabsList>
        <TabsTrigger value="leaderboard">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </TabsTrigger>
        <TabsTrigger value="winnings">
          <TrendingUp className="h-4 w-4" />
          Winnings Over Time
        </TabsTrigger>
        <TabsTrigger value="stats">
          <BarChart3 className="h-4 w-4" />
          Group Stats
        </TabsTrigger>
      </TabsList>

      <TabsContent value="leaderboard">
        {leaderboard.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <LeaderboardTable
                rows={leaderboard}
                groupId={groupId}
                placeholderIds={placeholderIds}
              />
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
      </TabsContent>

      <TabsContent value="winnings">
        <Card>
          <CardContent className="pt-6">
            <GroupWinningsChart players={chartPlayers} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats">
        {groupStats.totalSessions > 0 ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Sessions"
              value={groupStats.totalSessions.toString()}
              sub={`${groupStats.totalPlayers} unique players`}
            />
            <StatCard
              label="Total Money In Play"
              value={fmt(groupStats.totalBuyIn)}
              sub={`across ${groupStats.totalEntries} buy-ins`}
            />
            <StatCard
              label="Avg Pot Per Session"
              value={fmt(groupStats.avgBuyInPerSession)}
              sub={`${groupStats.avgPlayersPerSession} players per session`}
            />
            <StatCard
              label="Avg Buy-in Per Player"
              value={fmt(groupStats.avgBuyInPerEntry)}
              sub="per session appearance"
            />
            <StatCard
              label="Avg Lifetime Per Player"
              value={fmt(groupStats.avgBuyInPerPlayer)}
              sub="total across all sessions"
            />
            {groupStats.biggestPot > 0 && (
              <StatCard
                label="Biggest Pot"
                value={fmt(groupStats.biggestPot)}
                sub={new Date(groupStats.biggestPotDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No finalized sessions yet. Stats will appear once sessions are finalized.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
