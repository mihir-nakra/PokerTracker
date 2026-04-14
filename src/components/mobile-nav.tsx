"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";

interface MobileNavProps {
  profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
  groups: { id: string; name: string; role: string }[];
}

export function MobileNav({ profile, groups }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <Link href="/dashboard" className="text-lg font-bold">
        Poker Tracker
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="sm" />}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <nav className="mt-6 flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
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
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm hover:bg-accent truncate",
                  pathname.startsWith(`/groups/${group.id}`) && "bg-accent font-medium"
                )}
              >
                {group.name}
              </Link>
            ))}
            <Link
              href="/groups/new"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
            >
              + Create Group
            </Link>
          </nav>
          <div className="mt-auto pt-4">
            <UserNav profile={profile} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
