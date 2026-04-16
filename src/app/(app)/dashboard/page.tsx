import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/groups/group-card";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, groups(id, name, owner_id, created_at)")
    .eq("user_id", user!.id);

  const groups =
    memberships?.map((m) => {
      const g = m.groups as unknown as { id: string; name: string; owner_id: string; created_at: string };
      return { ...g, role: m.role };
    }) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Groups</h1>
        <div className="flex gap-2">
          <Button nativeButton={false} className="min-h-11 sm:min-h-9" render={<Link href="/groups/new" />}>
            Create Group
          </Button>
          <SignOutButton />
        </div>
      </div>
      {groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>You&apos;re not in any groups yet.</p>
          <p className="mt-2">Create one or join with an invite link.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
