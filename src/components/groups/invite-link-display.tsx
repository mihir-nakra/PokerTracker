"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { regenerateInviteCode } from "@/lib/actions/groups";
import { toast } from "sonner";

interface InviteLinkDisplayProps {
  inviteCode: string;
  groupId: string;
  canRegenerate: boolean;
}

export function InviteLinkDisplay({
  inviteCode,
  groupId,
  canRegenerate,
}: InviteLinkDisplayProps) {
  const [regenerating, setRegenerating] = useState(false);
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied!");
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const result = await regenerateInviteCode(groupId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Invite code regenerated");
    }
    setRegenerating(false);
  }

  return (
    <div className="flex gap-2">
      <Input value={inviteUrl} readOnly className="font-mono text-sm" />
      <Button variant="outline" onClick={handleCopy}>
        Copy
      </Button>
      {canRegenerate && (
        <Button
          variant="outline"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? "..." : "Regenerate"}
        </Button>
      )}
    </div>
  );
}
