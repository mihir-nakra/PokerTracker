import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, ArrowRight } from "lucide-react";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    role: string;
    created_at: string;
  };
  memberCount: number;
  lastSessionDate: string | null;
}

function formatLastSession(date: string | null): string {
  if (!date) return "No games yet";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GroupCard({ group, memberCount, lastSessionDate }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="group hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs capitalize">{group.role}</Badge>
          </div>
          <CardTitle className="text-base mt-3">{group.name}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {memberCount} {memberCount === 1 ? "Player" : "Players"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatLastSession(lastSessionDate)}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
