import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    role: string;
    created_at: string;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <Badge variant="secondary">{group.role}</Badge>
          </div>
          <CardDescription>
            Created {new Date(group.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
