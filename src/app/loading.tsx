import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Skeleton className="h-12 w-32 rounded-xl" />
      <Skeleton className="mt-4 h-4 w-48 rounded" />
    </div>
  );
}
