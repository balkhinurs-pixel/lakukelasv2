
'use client'

import { useEffect, useState } from 'react';
import { getDashboardData } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ScheduleItem, JournalEntry } from "@/lib/types";

function LoadingSkeleton() {
    return (
        <div className="space-y-8 p-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-10 w-10 rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </Card>
                ))}
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(2)].map((_, i) => (
                             <div key={i} className="flex items-start gap-6">
                                <Skeleton className="h-12 w-12 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-3/5" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-4">
                     <CardHeader>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {[...Array(3)].map((_, i) => (
                             <div key={i} className="p-4 rounded-xl border">
                                <div className="flex justify-between">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-2/5" />
                                        <Skeleton className="h-4 w-1/5" />
                                    </div>
                                    <div className="space-y-2 w-16 text-right">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-full" />
                                    </div>
                                </div>
                            </div>
                         ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

type DashboardData = {
    todaySchedule: ScheduleItem[];
    journalEntries: JournalEntry[];
    attendancePercentage: number;
    unfilledJournalsCount: number;
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [userTimeZone, setUserTimeZone] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimeZone(timeZone);

        async function loadData() {
            try {
                const result = await getDashboardData(timeZone);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        
        loadData();
    }, []);

    if (loading || !data) {
        return <LoadingSkeleton />;
    }
    
    return (
        <DashboardClientPage 
            todaySchedule={data.todaySchedule} 
            journalEntries={data.journalEntries}
            initialAttendancePercentage={data.attendancePercentage}
            initialUnfilledJournalsCount={data.unfilledJournalsCount}
            userTimeZone={userTimeZone}
        />
    );
}
