"use client";

import { useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      className="min-h-11 sm:min-h-9"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
      }}
    >
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}
