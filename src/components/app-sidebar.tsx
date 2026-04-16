"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";
import { LayoutDashboard, Plus, Users } from "lucide-react";

interface AppSidebarProps {
  profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
  groups: { id: string; name: string; role: string }[];
}

export function AppSidebar({ profile, groups }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="p-5 pb-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">PT</span>
          </div>
          <span className="text-lg font-bold tracking-tight">PokerTracker</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="pt-5 pb-2 px-3">
          <span className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
            Poker Groups
          </span>
          <p className="text-xs text-sidebar-foreground/30 mt-0.5">Switch between active circles</p>
        </div>

        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith(`/groups/${group.id}`)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold",
              pathname.startsWith(`/groups/${group.id}`)
                ? "bg-primary text-primary-foreground"
                : "bg-sidebar-accent text-sidebar-foreground/60"
            )}>
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="truncate">{group.name}</span>
          </Link>
        ))}

        <Link
          href="/groups/new"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-sidebar-foreground/20">
            <Plus className="h-3.5 w-3.5" />
          </div>
          New Group
        </Link>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <UserNav profile={profile} />
      </div>
    </aside>
  );
}
