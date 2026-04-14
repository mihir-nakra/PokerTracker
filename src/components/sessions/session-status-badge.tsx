import { Badge } from "@/components/ui/badge";

export function SessionStatusBadge({ status }: { status: string }) {
  const variant =
    status === "finalized"
      ? "default"
      : status === "reconciling"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
