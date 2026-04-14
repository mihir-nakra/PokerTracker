import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalNet: number;
  sessionsPlayed: number;
  avgNet: number;
  bestSession: number;
  worstSession: number;
}

function formatDollars(n: number) {
  return `${n >= 0 ? "+" : ""}$${n.toFixed(2)}`;
}

export function StatsCards({
  totalNet,
  sessionsPlayed,
  avgNet,
  bestSession,
  worstSession,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Total Net",
      value: formatDollars(totalNet),
      color: totalNet >= 0 ? "text-green-600" : "text-red-600",
    },
    { label: "Sessions Played", value: sessionsPlayed.toString(), color: "" },
    {
      label: "Avg / Session",
      value: formatDollars(avgNet),
      color: avgNet >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Best Session",
      value: formatDollars(bestSession),
      color: "text-green-600",
    },
    {
      label: "Worst Session",
      value: formatDollars(worstSession),
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
