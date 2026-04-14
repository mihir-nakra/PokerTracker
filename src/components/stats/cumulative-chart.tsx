"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface CumulativeChartProps {
  data: { date: string; cumulative: number }[];
}

export function CumulativeChart({ data }: CumulativeChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cumulative"]}
            labelFormatter={(label) =>
              new Date(String(label) + "T00:00:00").toLocaleDateString()
            }
          />
          <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
