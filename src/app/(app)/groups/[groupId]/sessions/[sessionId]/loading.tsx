export default function SessionLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="h-6 w-20 bg-muted animate-pulse rounded" />
      </div>

      {/* Reconciliation skeleton */}
      <div className="rounded-md border p-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Entry rows skeleton */}
      <div className="rounded-md border">
        <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px] gap-2 p-3 border-b bg-muted/50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_100px] gap-2 p-3 border-b last:border-b-0 items-center"
          >
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-8 w-24 bg-muted animate-pulse rounded sm:ml-auto" />
            <div className="h-8 w-24 bg-muted animate-pulse rounded sm:ml-auto" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded sm:ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
