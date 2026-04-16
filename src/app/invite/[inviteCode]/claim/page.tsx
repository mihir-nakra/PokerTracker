import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUnclaimedPlaceholders } from "@/lib/actions/players";
import { ClaimPlayerUI } from "./claim-player-ui";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/invite/${inviteCode}`);
  }

  // Look up group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    redirect("/dashboard");
  }

  // Verify user is a member (they should have just joined)
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (!membership) {
    redirect(`/invite/${inviteCode}`);
  }

  const placeholders = await getUnclaimedPlaceholders(group.id);

  if (placeholders.length === 0) {
    redirect(`/groups/${group.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ClaimPlayerUI
        placeholders={placeholders}
        groupId={group.id}
        groupName={group.name}
      />
    </div>
  );
}
