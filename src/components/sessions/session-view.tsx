"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EntryRow } from "./entry-row";
import { SessionStatusBadge } from "./session-status-badge";
import { updateSessionStatus, deleteSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle, AlertCircle, Lock, Unlock, Trash2, Users, TrendingUp } from "lucide-react";

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
  const isBalanced = Math.abs(difference) < 0.01;
  const incompleteCount = entries.filter(
    (e) => e.totalBuyIn === 0 && e.cashOut === 0
  ).length;

  const bigWinner = entries.length > 0
    ? entries.reduce((best, e) => (e.net > best.net ? e : best), entries[0])
    : null;
  const playersWithBuyIn = entries.filter((e) => e.totalBuyIn > 0).length;
  const avgBuyIn = playersWithBuyIn > 0 ? totalBuyIns / playersWithBuyIn : 0;

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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <SessionStatusBadge status={session.status} />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(session.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Session Ledger
          </h1>
          {session.notes && (
            <p className="text-muted-foreground mt-1">{session.notes}</p>
          )}
        </div>
      </div>

      {/* Main content: two-column on desktop */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left: Player Ledger */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Player Ledger
            </h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px] gap-2 px-4 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Player</div>
                <div className="text-right">Buy-in ($)</div>
                <div className="text-right">Cash-out ($)</div>
                <div className="text-right">Net Result</div>
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
              {/* Totals row - desktop */}
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px] gap-2 px-4 py-3 border-t bg-muted/30 text-sm font-semibold">
                <div className="text-muted-foreground">Totals</div>
                <div className="text-right tabular-nums">${totalBuyIns.toFixed(2)}</div>
                <div className="text-right tabular-nums">${totalCashOuts.toFixed(2)}</div>
                <div className={cn(
                  "text-right tabular-nums",
                  isBalanced ? "text-emerald-600" : "text-red-500"
                )}>
                  {isBalanced ? "Balanced" : `$${Math.abs(difference).toFixed(2)}`}
                </div>
              </div>
              {/* Totals row - mobile */}
              <div className="sm:hidden px-4 py-3 border-t bg-muted/30 text-sm font-semibold space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Buy-ins</span>
                  <span className="tabular-nums">${totalBuyIns.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cash-outs</span>
                  <span className="tabular-nums">${totalCashOuts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={cn(
                    "tabular-nums",
                    isBalanced ? "text-emerald-600" : "text-red-500"
                  )}>
                    {isBalanced ? "Balanced" : `Off by $${Math.abs(difference).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar cards — shows first on mobile */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Pot Distribution */}
          <Card className="bg-emerald-800 dark:bg-emerald-900 text-white border-0">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-100/60">
                Pot Distribution
              </h3>
              <p className="text-3xl font-bold tabular-nums">
                ${totalBuyIns.toFixed(2)}
              </p>
              <p className="text-sm text-emerald-100/70">
                Total Buy-in recorded across {entries.length} {entries.length === 1 ? "player" : "players"}.
              </p>
              <div className="flex items-center gap-2 text-sm">
                {isBalanced ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-100">Ledger is currently balanced</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-emerald-100">Off by ${Math.abs(difference).toFixed(2)}</span>
                  </>
                )}
              </div>
              {incompleteCount > 0 && (
                <p className="text-xs text-emerald-100/50">
                  Waiting on {incompleteCount} player{incompleteCount > 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Session Insights */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Session Insights
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Players
                  </span>
                  <span className="font-medium">{entries.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Avg Buy-in
                  </span>
                  <span className="font-medium tabular-nums">${avgBuyIn.toFixed(2)}</span>
                </div>
                {bigWinner && bigWinner.net > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-base leading-none">&#9733;</span>
                      Big Winner
                    </span>
                    <span className="font-medium">{bigWinner.displayName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {isAdminOrOwner && (
            <Card className="bg-emerald-900 dark:bg-emerald-950 text-white border-0 dark:ring-1 dark:ring-emerald-800">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-100/60">
                  Admin Quick Actions
                </h3>
                <div className="flex gap-2">
                  {!isFinalized && (
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white"
                      onClick={handleFinalize}
                      disabled={loading}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      {loading ? "..." : "Finalize"}
                    </Button>
                  )}
                  {isFinalized && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 border-emerald-700 text-emerald-100 hover:bg-emerald-900"
                      onClick={handleReopen}
                      disabled={loading}
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      {loading ? "..." : "Reopen"}
                    </Button>
                  )}
                  {session.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-700/50 text-red-300 hover:bg-red-950 hover:text-red-200"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
