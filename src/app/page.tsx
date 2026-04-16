import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Trophy, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">PT</span>
          </div>
          <span className="text-lg font-bold tracking-tight">PokerTracker</span>
        </div>
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
      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 text-center max-w-6xl mx-auto">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Free to use
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            The best games happen{" "}
            <span className="text-primary">where friends meet.</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Create groups with friends, log buy-ins and cash-outs, and see who&apos;s
            winning over time with leaderboards and earnings charts.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button nativeButton={false} size="lg" className="min-h-12 px-8 text-base gap-2" render={<Link href="/signup" />}>
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button nativeButton={false} variant="outline" size="lg" className="min-h-12 px-8 text-base" render={<Link href="/login" />}>
            Sign In
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-3xl w-full mt-4">
          <div className="rounded-xl border bg-card p-6 text-left space-y-3 hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Poker Groups</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create circles for your regular game nights and invite friends with a simple link.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-left space-y-3 hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Session Tracking</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Log buy-ins and cash-outs with automatic reconciliation and balance checking.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-left space-y-3 hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Leaderboards</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track who&apos;s up and who&apos;s down with cumulative stats and earnings over time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        PokerTracker
      </footer>
    </div>
  );
}
