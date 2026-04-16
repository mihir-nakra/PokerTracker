"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EntryRow } from "./entry-row";
import { ReconciliationSummary } from "./reconciliation-summary";
import { SessionStatusBadge } from "./session-status-badge";
import { updateSessionStatus, deleteSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EntryData {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isPlaceholder: boolean;
  totalBuyIn: number;
  cashOut: number;
  net: number;
}

interface SessionViewProps {
  session: {
    id: string;
    group_id: string;
    date: string;
    status: string;
    notes: string | null;
  };
  entries: EntryData[];
  groupId: string;
  currentUserId: string;
  isAdminOrOwner: boolean;
}

export function SessionView({
  session,
  entries,
  groupId,
  currentUserId,
  isAdminOrOwner,
}: SessionViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isFinalized = session.status === "finalized";

  const totalBuyIns = entries.reduce((sum, e) => sum + e.totalBuyIn, 0);
  const totalCashOuts = entries.reduce((sum, e) => sum + e.cashOut, 0);
  const difference = totalCashOuts - totalBuyIns;
  const incompleteCount = entries.filter(
    (e) => e.totalBuyIn === 0 && e.cashOut === 0
  ).length;

  async function handleFinalize() {
    setLoading(true);
    const result = await updateSessionStatus(session.id, groupId, "finalized");
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Session finalized");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReopen() {
    setLoading(true);
    const result = await updateSessionStatus(session.id, groupId, "draft");
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Session reopened");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    setLoading(true);
    const result = await deleteSession(session.id, groupId);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Session — {new Date(session.date).toLocaleDateString()}
          </h1>
          {session.notes && (
            <p className="text-sm text-muted-foreground mt-1">
              {session.notes}
            </p>
          )}
        </div>
        <SessionStatusBadge status={session.status} />
      </div>

      <ReconciliationSummary
        totalBuyIns={totalBuyIns}
        totalCashOuts={totalCashOuts}
        difference={difference}
        incompleteCount={incompleteCount}
      />

      {/* Entry table */}
      <div className="rounded-md border">
        <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px] gap-2 p-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          <div>Player</div>
          <div className="text-right">Buy-in</div>
          <div className="text-right">Cash-out</div>
          <div className="text-right">Net</div>
        </div>
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            groupId={groupId}
            sessionId={session.id}
            canEdit={
              !isFinalized &&
              (entry.userId === currentUserId || isAdminOrOwner)
            }
          />
        ))}
      </div>

      {/* Actions */}
      {isAdminOrOwner && (
        <div className="flex flex-wrap gap-2">
          {!isFinalized && (
            <Button className="min-h-11 sm:min-h-9" onClick={handleFinalize} disabled={loading}>
              {loading ? "..." : "Finalize Session"}
            </Button>
          )}
          {isFinalized && (
            <Button className="min-h-11 sm:min-h-9" variant="outline" onClick={handleReopen} disabled={loading}>
              {loading ? "..." : "Reopen Session"}
            </Button>
          )}
          {session.status === "draft" && (
            <Button
              className="min-h-11 sm:min-h-9"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Session
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
