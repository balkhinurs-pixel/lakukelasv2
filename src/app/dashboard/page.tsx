
'use client'

import { getDashboardData } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';
import type { ScheduleItem, JournalEntry } from "@/lib/types";
import * as React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { getIndonesianDayName } from '@/lib/timezone';

type DashboardData = {
    todaySchedule: ScheduleItem[];
    journalEntries: JournalEntry[];
    attendancePercentage: number;
    unfilledJournalsCount: number;
};

function DashboardLoadingSkeleton() {
    return (
        <div className="space-y-8 p-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3 space-y-4">
                     <Skeleton className="h-8 w-48" />
                     <Skeleton className="h-4 w-64" />
                     <div className="space-y-4 pt-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-12 w-12 rounded-2xl" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="space-y-3 pt-4">
                       {[...Array(3)].map((_, i) => (
                         <Skeleton key={i} className="h-16 w-full rounded-xl" />
                       ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Use Indonesian timezone for consistent day calculation
                const indonesianDayName = getIndonesianDayName();
                
                // Also get user's local day for comparison
                const userToday = new Date();
                const dayViaDateFns = format(userToday, 'eeee', { locale: id });
                const dayViaIntl = userToday.toLocaleDateString('id-ID', { weekday: 'long' });
                
                // TEMPORARY DEBUG
                console.log('=== DASHBOARD DAY CALCULATION ===');
                console.log('Indonesian timezone day:', indonesianDayName);
                console.log('User local via date-fns:', dayViaDateFns);
                console.log('User local via Intl:', dayViaIntl);
                
                // Use Indonesian timezone day as primary, with user local as fallback
                let finalDayForQuery = indonesianDayName;
                
                // Map common variations to ensure consistency
                const dayMapping: Record<string, string> = {
                    'Senin': 'Senin',
                    'Selasa': 'Selasa', 
                    'Rabu': 'Rabu',
                    'Kamis': 'Kamis',
                    'Jumat': 'Jumat',
                    'Sabtu': 'Sabtu',
                    'Minggu': 'Minggu',
                    'Monday': 'Senin',
                    'Tuesday': 'Selasa',
                    'Wednesday': 'Rabu', 
                    'Thursday': 'Kamis',
                    'Friday': 'Jumat',
                    'Saturday': 'Sabtu',
                    'Sunday': 'Minggu'
                };
                
                finalDayForQuery = dayMapping[finalDayForQuery] || finalDayForQuery;
                
                console.log('Final day for query:', finalDayForQuery);
                console.log('=== END DASHBOARD DAY CALCULATION ===');
                
                const dashboardData = await getDashboardData(finalDayForQuery);
                setData(dashboardData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                // Handle error state if necessary
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);
    
    if (loading || !data) {
        return <DashboardLoadingSkeleton />;
    }
    
    return (
        <DashboardClientPage 
            todaySchedule={data.todaySchedule} 
            journalEntries={data.journalEntries}
            initialAttendancePercentage={data.attendancePercentage}
            initialUnfilledJournalsCount={data.unfilledJournalsCount}
        />
    );
}
