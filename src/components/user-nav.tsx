"use client";

import { signOut } from "@/lib/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

interface UserNavProps {
  profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
}

export function UserNav({ profile }: UserNavProps) {
  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2.5 hover:bg-sidebar-accent transition-colors">
        <Avatar className="h-8 w-8 border border-sidebar-border">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left min-w-0">
          <span className="block truncate text-sm font-medium">
            {profile?.display_name ?? "User"}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem render={<Link href="/profile" />}>
          <Settings className="h-4 w-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
