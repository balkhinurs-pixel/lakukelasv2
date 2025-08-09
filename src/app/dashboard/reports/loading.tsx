import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2 border-b">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
        </Card>
        <Card>
            <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
        </Card>
        <Card>
            <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <Skeleton className="h-7 w-1/3 mb-1" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}