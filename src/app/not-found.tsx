import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Go Home
      </Button>
    </div>
  );
}
