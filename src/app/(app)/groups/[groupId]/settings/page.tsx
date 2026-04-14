import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MemberList } from "@/components/groups/member-list";
import { InviteLinkDisplay } from "@/components/groups/invite-link-display";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const { data: currentMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user!.id)
    .single();

  if (!currentMembership) notFound();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, user_id, role, profiles(id, display_name, avatar_url)")
    .eq("group_id", groupId);

  const members =
    memberships?.map((m) => ({
      userId: m.user_id,
      role: m.role,
      displayName: (m.profiles as unknown as { display_name: string | null })?.display_name ?? "Unknown",
      avatarUrl: (m.profiles as unknown as { avatar_url: string | null })?.avatar_url,
    })) ?? [];

  const isAdminOrOwner =
    currentMembership.role === "owner" || currentMembership.role === "admin";

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">{group.name} — Settings</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Invite Link</h2>
        <InviteLinkDisplay
          inviteCode={group.invite_code}
          groupId={groupId}
          canRegenerate={isAdminOrOwner}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <MemberList
          members={members}
          groupId={groupId}
          currentUserId={user!.id}
          currentUserRole={currentMembership.role}
        />
      </section>
    </div>
  );
}
