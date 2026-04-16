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
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Total Net</TableHead>
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

          return (
            <TableRow key={row.user_id}>
              <TableCell className="font-medium">{i + 1}</TableCell>
              <TableCell>
                <Link
                  href={`/groups/${groupId}/players/${row.user_id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  {row.display_name ?? "Unknown"}
                  {placeholderIds?.has(row.user_id) && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Unclaimed
                    </Badge>
                  )}
                </Link>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium",
                  row.total_net > 0 && "text-green-600",
                  row.total_net < 0 && "text-red-600"
                )}
              >
                {row.total_net >= 0 ? "+" : ""}${Number(row.total_net).toFixed(2)}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                {row.sessions_played}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                ${Number(row.avg_net).toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
