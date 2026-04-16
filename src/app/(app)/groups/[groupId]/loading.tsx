export default function GroupLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Leaderboard skeleton */}
      <section>
        <div className="h-6 w-28 bg-muted animate-pulse rounded mb-4" />
        <div className="rounded-md border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 border-b last:border-b-0"
            >
              <div className="h-5 w-5 bg-muted animate-pulse rounded" />
              <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="ml-auto h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Sessions skeleton */}
      <section>
        <div className="h-6 w-36 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
