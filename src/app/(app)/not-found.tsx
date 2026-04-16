import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        The group, session, or page you&apos;re looking for doesn&apos;t exist or you
        don&apos;t have access.
      </p>
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Back to Dashboard
      </Button>
    </div>
  );
}
