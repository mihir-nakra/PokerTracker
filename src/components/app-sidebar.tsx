"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";

interface AppSidebarProps {
  profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
  groups: { id: string; name: string; role: string }[];
}

export function AppSidebar({ profile, groups }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40 p-4">
      <Link href="/dashboard" className="mb-6 px-2 text-xl font-bold">
        Poker Tracker
      </Link>
      <nav className="flex-1 space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
            pathname === "/dashboard" && "bg-accent"
          )}
        >
          Dashboard
        </Link>
        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Groups
        </div>
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className={cn(
              "block rounded-md px-3 py-2 text-sm hover:bg-accent truncate",
              pathname.startsWith(`/groups/${group.id}`) && "bg-accent font-medium"
            )}
          >
            {group.name}
          </Link>
        ))}
        <Link
          href="/groups/new"
          className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          + Create Group
        </Link>
      </nav>
      <UserNav profile={profile} />
    </aside>
  );
}
