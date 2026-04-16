"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/groups/leaderboard-table";
import { GroupWinningsChart } from "@/components/groups/group-winnings-chart";
import { Trophy, TrendingUp } from "lucide-react";

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

interface GroupStatsTabsProps {
  leaderboard: LeaderboardRow[];
  groupId: string;
  placeholderIds: Set<string>;
  chartPlayers: PlayerSeries[];
  currentUserId: string;
}

export function GroupStatsTabs({
  leaderboard,
  groupId,
  placeholderIds,
  chartPlayers,
  currentUserId,
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
    </Tabs>
  );
}
