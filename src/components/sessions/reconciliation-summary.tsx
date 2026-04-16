import { cn } from "@/lib/utils";

interface ReconciliationSummaryProps {
  totalBuyIns: number;
  totalCashOuts: number;
  difference: number;
  incompleteCount: number;
}

export function ReconciliationSummary({
  totalBuyIns,
  totalCashOuts,
  difference,
  incompleteCount,
}: ReconciliationSummaryProps) {
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="rounded-md border p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total Buy-ins</span>
        <span className="font-medium">${totalBuyIns.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total Cash-outs</span>
        <span className="font-medium">${totalCashOuts.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-sm">
        <span className="text-muted-foreground">Difference</span>
        <span
          className={cn(
            "font-semibold",
            isBalanced ? "text-emerald-600" : "text-red-500"
          )}
        >
          {isBalanced ? "Balanced" : `Off by $${Math.abs(difference).toFixed(2)}`}
        </span>
      </div>
      {incompleteCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Waiting on {incompleteCount} player{incompleteCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
