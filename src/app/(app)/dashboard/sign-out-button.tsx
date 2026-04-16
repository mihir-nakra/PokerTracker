"use client";

import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="min-h-11 sm:min-h-9"
      onClick={() => signOut()}
    >
      Sign Out
    </Button>
  );
}
