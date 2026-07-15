export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-muted">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-2 h-8 w-24" />
      </div>
    </div>
  );
}
