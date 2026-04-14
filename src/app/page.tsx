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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Poker Tracker
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Track buy-ins, cash-outs, and long-term performance across your poker
        friend group.
      </p>
      <div className="flex gap-4">
        <Button nativeButton={false} size="lg" render={<Link href="/signup" />}>
          Get Started
        </Button>
        <Button nativeButton={false} variant="outline" size="lg" render={<Link href="/login" />}>
          Sign In
        </Button>
      </div>
    </div>
  );
}
