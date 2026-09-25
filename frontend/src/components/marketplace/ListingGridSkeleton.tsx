import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ListingGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4", className)} aria-label="Loading listings">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-0" aria-hidden="true">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="mt-3 h-5 w-2/5" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <div className="mt-3 flex justify-between gap-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
