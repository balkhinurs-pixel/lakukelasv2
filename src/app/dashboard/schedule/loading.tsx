import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
             <Card key={i}>
                <CardHeader>
                   <Skeleton className="h-7 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="space-y-1">
                         <Skeleton className="h-5 w-32" />
                         <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                   </div>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                         <Skeleton className="h-5 w-32" />
                         <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>
    </div>
  );
}