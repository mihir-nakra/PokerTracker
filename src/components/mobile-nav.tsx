"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { LayoutDashboard, Menu, Plus, Users } from "lucide-react";

interface MobileNavProps {
  profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
  groups: { id: string; name: string; role: string }[];
}

export function MobileNav({ profile, groups }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-xs font-bold">PT</span>
        </div>
        <span className="text-base font-bold tracking-tight">PokerTracker</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="sm" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <div className="p-5 pb-2">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">PT</span>
              </div>
              <span className="text-lg font-bold tracking-tight">PokerTracker</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <div className="pt-5 pb-2 px-3">
              <span className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                Poker Groups
              </span>
            </div>

            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  pathname.startsWith(`/groups/${group.id}`)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                )}
              >
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-xs",
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
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-sidebar-foreground/20">
                <Plus className="h-3.5 w-3.5" />
              </div>
              New Group
            </Link>
          </nav>
          <div className="border-t border-sidebar-border p-3 mt-auto">
            <UserNav profile={profile} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
