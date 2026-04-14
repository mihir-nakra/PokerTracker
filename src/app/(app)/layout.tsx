import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("group_id, role, groups(id, name)")
    .eq("user_id", user.id);

  const groups =
    memberships?.map((m) => {
      const g = m.groups as unknown as { id: string; name: string };
      return { id: g.id, name: g.name, role: m.role };
    }) ?? [];

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        profile={profile}
        groups={groups}
      />
      <MobileNav profile={profile} groups={groups} />
      <main className="flex-1 p-6 md:p-8 pt-16 md:pt-8">{children}</main>
    </div>
  );
}
