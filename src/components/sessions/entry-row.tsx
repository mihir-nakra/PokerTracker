"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEntry } from "@/lib/actions/entries";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  const initials = entry.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSave(field: "total_buy_in" | "cash_out", value: string) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    setSaving(true);
    const result = await updateEntry(
      entry.id,
      { [field]: num },
      groupId,
      sessionId
    );
    if (result?.error) {
      toast.error(result.error);
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_100px] gap-2 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/20 transition-colors">
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
            onBlur={() => handleSave("total_buy_in", buyIn)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave("total_buy_in", buyIn);
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
            onBlur={() => handleSave("cash_out", cashOut)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave("cash_out", cashOut);
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
    </div>
  );
}
