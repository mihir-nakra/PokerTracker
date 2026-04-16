import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { joinGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Users, UserPlus } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  // Look up group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">PT</span>
            </div>
            <span className="text-xl font-bold tracking-tight">PokerTracker</span>
          </div>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/invite/${inviteCode}`);
  }

  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (existing) {
    redirect(`/groups/${group.id}`);
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);

  // Check for unclaimed placeholders
  const { data: placeholders } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_placeholder", true)
    .eq("created_by_group_id", group.id);

  const hasPlaceholders = placeholders && placeholders.length > 0;

  async function handleJoin() {
    "use server";
    await joinGroup(inviteCode);
    if (hasPlaceholders) {
      redirect(`/invite/${inviteCode}/claim`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">PT</span>
          </div>
          <span className="text-xl font-bold tracking-tight">PokerTracker</span>
        </div>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-7 w-7 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">You&apos;re invited to join</CardTitle>
            <p className="text-2xl font-bold text-primary mt-1">{group.name}</p>
          </div>
          <CardDescription>
            You&apos;ve been sent a seat at the table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-6 rounded-lg border p-4">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members</p>
              <p className="flex items-center gap-1.5 mt-1 font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                {memberCount ?? 0} Active
              </p>
            </div>
          </div>
          <form action={handleJoin}>
            <Button type="submit" size="lg" className="w-full">
              Join Group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
