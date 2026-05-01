import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-fade-in" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
          <Skeleton className="mt-0.5 h-4 w-4 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-xl border bg-card p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}