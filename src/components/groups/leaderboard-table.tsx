import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_net: number;
  sessions_played: number;
  avg_net: number;
}

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  groupId: string;
  placeholderIds?: Set<string>;
}

export function LeaderboardTable({ rows, groupId, placeholderIds }: LeaderboardTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-14 text-center">#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Net Result</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Sessions</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Avg/Session</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          const initials = (row.display_name ?? "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const isTop3 = i < 3;

          return (
            <TableRow key={row.user_id} className="group">
              <TableCell className="text-center">
                {isTop3 ? (
                  <div className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    i === 0 && "bg-amber-500/15 text-amber-600",
                    i === 1 && "bg-muted text-muted-foreground",
                    i === 2 && "bg-amber-600/10 text-amber-700"
                  )}>
                    {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{i + 1}</span>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/groups/${groupId}/players/${row.user_id}`}
                  className="flex items-center gap-2.5 hover:underline"
                >
                  <Avatar className={cn(
                    "h-8 w-8",
                    i === 0 && "ring-2 ring-amber-500/30"
                  )}>
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{row.display_name ?? "Unknown"}</span>
                  {placeholderIds?.has(row.user_id) && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Unclaimed
                    </Badge>
                  )}
                </Link>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  row.total_net > 0 && "text-emerald-600",
                  row.total_net < 0 && "text-red-500"
                )}
              >
                {row.total_net >= 0 ? "+" : ""}${Number(row.total_net).toFixed(2)}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                {row.sessions_played}
              </TableCell>
              <TableCell className={cn(
                "text-right hidden sm:table-cell tabular-nums",
                row.avg_net > 0 && "text-emerald-600",
                row.avg_net < 0 && "text-red-500"
              )}>
                ${Number(row.avg_net).toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
