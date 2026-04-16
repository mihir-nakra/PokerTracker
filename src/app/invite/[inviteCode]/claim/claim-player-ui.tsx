"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimPlaceholderPlayer } from "@/lib/actions/players";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface Placeholder {
  id: string;
  displayName: string;
  totalNet: number;
  sessionsPlayed: number;
}

interface ClaimPlayerUIProps {
  placeholders: Placeholder[];
  groupId: string;
  groupName: string;
}

export function ClaimPlayerUI({ placeholders, groupId, groupName }: ClaimPlayerUIProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<Placeholder | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClaim(placeholder: Placeholder) {
    setLoading(true);
    const result = await claimPlaceholderPlayer(groupId, placeholder.id);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      setConfirming(null);
    } else {
      toast.success(`Claimed ${placeholder.displayName}'s profile`);
      router.push(`/groups/${groupId}`);
    }
  }

  function handleSkip() {
    router.push(`/groups/${groupId}`);
  }

  // Confirmation screen
  if (confirming) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Claim {confirming.displayName}?</CardTitle>
          <CardDescription>
            You will inherit all of this player&apos;s history and stats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sessions played</span>
              <span className="font-medium">{confirming.sessionsPlayed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total net</span>
              <span className={`font-medium ${confirming.totalNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                {confirming.totalNet >= 0 ? "+" : ""}${confirming.totalNet.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirming(null)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleClaim(confirming)}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Confirm"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Placeholder selection screen
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Welcome to {groupName}!</CardTitle>
        <CardDescription>
          Are you one of these existing players? Claim your profile to inherit your stats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {placeholders.map((p) => (
          <button
            key={p.id}
            onClick={() => setConfirming(p)}
            className="w-full flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors text-left"
          >
            <span className="font-medium">{p.displayName}</span>
            <span className="text-sm text-muted-foreground">
              {p.sessionsPlayed} {p.sessionsPlayed === 1 ? "session" : "sessions"}
            </span>
          </button>
        ))}
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleSkip}
        >
          Skip — join as new player
        </Button>
      </CardContent>
    </Card>
  );
}
