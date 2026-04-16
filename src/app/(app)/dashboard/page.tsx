import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/groups/group-card";
import { Plus, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, groups(id, name, owner_id, created_at)")
    .eq("user_id", user!.id);

  const groups =
    memberships?.map((m) => {
      const g = m.groups as unknown as { id: string; name: string; owner_id: string; created_at: string };
      return { ...g, role: m.role };
    }) ?? [];

  const groupIds = groups.map((g) => g.id);

  // Batch fetch member counts
  const groupMemberCounts: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: allMemberships } = await supabase
      .from("memberships")
      .select("group_id")
      .in("group_id", groupIds);
    for (const m of allMemberships ?? []) {
      groupMemberCounts[m.group_id] = (groupMemberCounts[m.group_id] ?? 0) + 1;
    }
  }

  // Batch fetch last session dates
  const groupLastSessions: Record<string, string | null> = {};
  if (groupIds.length > 0) {
    const { data: allSessions } = await supabase
      .from("sessions")
      .select("group_id, date")
      .in("group_id", groupIds)
      .order("date", { ascending: false });
    for (const s of allSessions ?? []) {
      if (!groupLastSessions[s.group_id]) {
        groupLastSessions[s.group_id] = s.date;
      }
    }
  }

  const firstName = profile?.display_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {firstName}</h1>
          <p className="text-muted-foreground mt-1">
            {groups.length > 0
              ? `You're in ${groups.length} group${groups.length > 1 ? "s" : ""}.`
              : "Your lounge is ready. Create a group to get started."}
          </p>
        </div>
        <Button nativeButton={false} className="min-h-11 sm:min-h-9 gap-2" render={<Link href="/groups/new" />}>
          <Plus className="h-4 w-4" />
          Create New Group
        </Button>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No groups yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create a group and invite your poker friends, or join one with an invite link.
          </p>
          <Button nativeButton={false} render={<Link href="/groups/new" />}>
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Circles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                memberCount={groupMemberCounts[group.id] ?? 0}
                lastSessionDate={groupLastSessions[group.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
