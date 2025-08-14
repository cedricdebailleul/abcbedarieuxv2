import { Skeleton } from "@/components/ui/skeleton";

export function MapSkeleton() {
  return (
    <div className="h-full flex">
      {/* Sidebar filters skeleton */}
      <div className="hidden lg:flex w-80 flex-col border-r bg-background p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-6 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        <Skeleton className="h-10 w-full" />
      </div>

      {/* Map skeleton */}
      <div className="flex-1 relative bg-muted/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>

        {/* Mobile filter button skeleton */}
        <div className="lg:hidden absolute top-4 left-4 z-10">
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Mobile search skeleton */}
        <div className="lg:hidden absolute top-4 right-4 left-20 z-10">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}