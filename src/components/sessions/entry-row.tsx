"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEntry } from "@/lib/actions/entries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface EntryRowProps {
  entry: {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    isPlaceholder: boolean;
    totalBuyIn: number;
    cashOut: number;
    net: number;
  };
  groupId: string;
  sessionId: string;
  canEdit: boolean;
}

export function EntryRow({ entry, groupId, sessionId, canEdit }: EntryRowProps) {
  const router = useRouter();
  const [buyIn, setBuyIn] = useState(entry.totalBuyIn.toString());
  const [cashOut, setCashOut] = useState(entry.cashOut.toString());
  const [saving, setSaving] = useState(false);

  const localNet = Number(cashOut) - Number(buyIn);

  const buyInChanged = parseFloat(buyIn) !== entry.totalBuyIn;
  const cashOutChanged = parseFloat(cashOut) !== entry.cashOut;
  const hasChanges = buyInChanged || cashOutChanged;

  const initials = entry.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSave() {
    const updates: Record<string, number> = {};
    if (buyInChanged) {
      const num = parseFloat(buyIn);
      if (isNaN(num) || num < 0) return;
      updates.total_buy_in = num;
    }
    if (cashOutChanged) {
      const num = parseFloat(cashOut);
      if (isNaN(num) || num < 0) return;
      updates.cash_out = num;
    }
    if (Object.keys(updates).length === 0) return;

    setSaving(true);
    const result = await updateEntry(entry.id, updates, groupId, sessionId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Saved");
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_100px_auto] gap-2 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-2.5">
        <Avatar className="h-8 w-8">
          <AvatarImage src={entry.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">{entry.displayName}</span>
        {entry.isPlaceholder && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Unclaimed
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 sm:justify-end">
        <span className="sm:hidden text-xs text-muted-foreground w-16">Buy-in:</span>
        {canEdit ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={buyIn}
            onChange={(e) => setBuyIn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            className="w-24 text-right h-8 tabular-nums"
            disabled={saving}
          />
        ) : (
          <span className="text-sm text-right tabular-nums">${entry.totalBuyIn.toFixed(2)}</span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:justify-end">
        <span className="sm:hidden text-xs text-muted-foreground w-16">Cash-out:</span>
        {canEdit ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={cashOut}
            onChange={(e) => setCashOut(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            className="w-24 text-right h-8 tabular-nums"
            disabled={saving}
          />
        ) : (
          <span className="text-sm text-right tabular-nums">${entry.cashOut.toFixed(2)}</span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:justify-end">
        <span className="sm:hidden text-xs text-muted-foreground w-16">Net:</span>
        <span
          className={cn(
            "text-sm font-semibold text-right tabular-nums",
            localNet > 0 && "text-emerald-600",
            localNet < 0 && "text-red-500"
          )}
        >
          {localNet >= 0 ? "+" : ""}${localNet.toFixed(2)}
        </span>
      </div>

      {canEdit ? (
        <div className="flex items-center sm:justify-center">
          <span className="sm:hidden text-xs text-muted-foreground w-16" />
          <Button
            variant={hasChanges ? "outline" : "ghost"}
            size="icon-sm"
            disabled={!hasChanges || saving}
            onClick={handleSave}
            className={cn(
              hasChanges
                ? "border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
                : "text-muted-foreground/30"
            )}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  );
}
