"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#d946ef", // fuchsia
  "#ca8a04", // yellow
  "#64748b", // slate
  "#e11d48", // rose
];

interface PlayerSeries {
  userId: string;
  displayName: string;
  data: { date: string; cumulative: number }[];
}

interface GroupWinningsChartProps {
  players: PlayerSeries[];
  currentUserId: string;
}

export function GroupWinningsChart({ players, currentUserId }: GroupWinningsChartProps) {
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(players.map((p) => p.userId))
  );

  const colorMap = new Map(players.map((p, i) => [p.userId, COLORS[i % COLORS.length]]));

  function togglePlayer(userId: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function selectAll() {
    setVisible(new Set(players.map((p) => p.userId)));
  }

  function selectJustMe() {
    setVisible(new Set([currentUserId]));
  }

  // Merge all players' data into unified data points keyed by date
  const visiblePlayers = players.filter((p) => visible.has(p.userId));
  const dateSet = new Set<string>();
  for (const p of visiblePlayers) {
    for (const d of p.data) {
      dateSet.add(d.date);
    }
  }
  const dates = Array.from(dateSet).sort();

  const merged = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const p of visiblePlayers) {
      let value: number | null = null;
      for (const d of p.data) {
        if (d.date <= date) value = d.cumulative;
      }
      if (value !== null) {
        point[p.userId] = value;
      }
    }
    return point;
  });

  if (players.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Not enough data to show a chart. At least one finalized session is needed.
      </p>
    );
  }

  const allSelected = visible.size === players.length;
  const justMeSelected = visible.size === 1 && visible.has(currentUserId);

  return (
    <div className="space-y-4">
      {/* Player toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={selectAll}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            allSelected
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
          )}
        >
          All
        </button>
        {players.some((p) => p.userId === currentUserId) && (
          <button
            onClick={selectJustMe}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              justMeSelected
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            )}
          >
            Just Me
          </button>
        )}
        <div className="w-px bg-border mx-1" />
        {players.map((p) => {
          const color = colorMap.get(p.userId)!;
          const isActive = visible.has(p.userId);
          return (
            <button
              key={p.userId}
              onClick={() => togglePlayer(p.userId)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                isActive
                  ? "text-white border-transparent"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
              )}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              {p.displayName}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {visiblePlayers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Select a player to see their winnings.
        </p>
      ) : (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: string) =>
                  new Date(v + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                formatter={(value, name) => {
                  const player = players.find((p) => p.userId === name);
                  return [`$${Number(value).toFixed(2)}`, player?.displayName ?? String(name)];
                }}
                labelFormatter={(label) =>
                  new Date(String(label) + "T00:00:00").toLocaleDateString()
                }
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              {visiblePlayers.map((p) => (
                <Line
                  key={p.userId}
                  type="monotone"
                  dataKey={p.userId}
                  name={p.displayName}
                  stroke={colorMap.get(p.userId)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
