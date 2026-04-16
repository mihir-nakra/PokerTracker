import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold">Poker Tracker</span>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button nativeButton={false} size="sm" render={<Link href="/signup" />}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Track your poker games
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Create groups with friends, log buy-ins and cash-outs, and see who&apos;s
            winning over time with leaderboards and earnings charts.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button nativeButton={false} size="lg" className="min-h-12 px-8 text-base" render={<Link href="/signup" />}>
            Get Started — It&apos;s Free
          </Button>
          <Button nativeButton={false} variant="outline" size="lg" className="min-h-12 px-8 text-base" render={<Link href="/login" />}>
            Sign In
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-2xl mt-8">
          <div className="space-y-2">
            <h3 className="font-semibold">Groups</h3>
            <p className="text-sm text-muted-foreground">
              Create poker groups and invite friends with a simple link.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Sessions</h3>
            <p className="text-sm text-muted-foreground">
              Track buy-ins and cash-outs with automatic reconciliation.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Stats</h3>
            <p className="text-sm text-muted-foreground">
              Leaderboards and cumulative earnings charts over time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
