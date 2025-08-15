import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden pt-8 pb-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

              <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-6 sm:h-8 w-32 sm:w-40 rounded-full" />
            <div>
              <Skeleton className="h-8 sm:h-12 lg:h-16 w-64 sm:w-80 lg:w-96 mb-2 sm:mb-3" />
              <Skeleton className="h-4 sm:h-6 w-80 sm:w-96 lg:w-[500px]" />
            </div>
          </div>
          <Skeleton className="h-8 sm:h-10 w-32 sm:w-40 rounded-full" />
        </div>
      </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-8 sm:pb-16">
        {/* Alert Skeleton */}
        <div className="mb-8">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-8">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
            <CardHeader>
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </CardHeader>
          </Card>

          {/* Summary Cards Skeleton */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <Skeleton className="h-4 w-32" />
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Skeleton className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Analysis Skeleton */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg">
                  <Skeleton className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex justify-around pt-2">
                      <div className="space-y-1">
                        <Skeleton className="h-6 w-12 mx-auto" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-6 w-12 mx-auto" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Card className="lg:col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}