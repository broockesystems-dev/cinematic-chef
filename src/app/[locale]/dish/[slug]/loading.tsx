import { Skeleton } from "@/components/ui/skeleton";

export default function DishLoading() {
  return (
    <div
      aria-busy="true"
      // As tall as the screen so the footer stays below the fold until the page arrives.
      className="mx-auto min-h-dvh w-full max-w-6xl space-y-10 px-4 pt-12 pb-10 sm:pt-32"
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-14 w-3/4 max-w-xl" />
        <Skeleton className="h-6 w-72" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>
    </div>
  );
}
