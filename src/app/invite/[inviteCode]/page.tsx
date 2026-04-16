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
      <div className="flex min-h-screen items-center justify-center px-4">
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

  // Not logged in — redirect to login with redirect back here
  if (!user) {
    redirect(`/login?redirect=/invite/${inviteCode}`);
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (existing) {
    redirect(`/groups/${group.id}`);
  }

  // Check if there are unclaimed placeholders
  const { data: placeholders } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_placeholder", true)
    .eq("created_by_group_id", group.id);

  const hasPlaceholders = placeholders && placeholders.length > 0;

  // Show join prompt
  async function handleJoin() {
    "use server";
    await joinGroup(inviteCode);
    if (hasPlaceholders) {
      redirect(`/invite/${inviteCode}/claim`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join {group.name}?</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this poker group.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <form action={handleJoin}>
            <Button type="submit" size="lg">
              Join Group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
