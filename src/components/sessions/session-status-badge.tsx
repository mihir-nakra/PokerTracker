import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SessionStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-semibold",
        status === "finalized" && "border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-500",
        status === "reconciling" && "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-500",
        status === "draft" && "border-border bg-muted text-muted-foreground"
      )}
    >
      {status === "finalized" && "Finalized"}
      {status === "reconciling" && "Reconciling"}
      {status === "draft" && "Draft"}
      {!["finalized", "reconciling", "draft"].includes(status) && status}
    </Badge>
  );
}
