
'use client'

import { getDashboardData, getUserProfile } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';
import type { ScheduleItem, Agenda, Holiday, Profile } from "@/lib/types";
import * as React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { getIndonesianDayName } from '@/lib/timezone';

type DashboardData = {
    todaySchedule: ScheduleItem[];
    agendas: Agenda[];
    attendancePercentage: number;
    unfilledJournalsCount: number;
    todayHoliday: Holiday | null;
    profile: Profile | null;
};

function DashboardLoadingSkeleton() {
    return (
        <div className="space-y-8 p-1">
            <Skeleton className="h-48 rounded-[32px]" />
            <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-[24px]" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-[24px]" />
        </div>
    )
}

export default function DashboardPage() {
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const indonesianDayName = getIndonesianDayName();
                const [dashboardData, profile] = await Promise.all([
                    getDashboardData(indonesianDayName),
                    getUserProfile()
                ]);
                
                setData({
                    ...(dashboardData as any),
                    profile
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
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
            agendas={data.agendas}
            initialAttendancePercentage={data.attendancePercentage}
            initialUnfilledJournalsCount={data.unfilledJournalsCount}
            todayHoliday={data.todayHoliday}
            profileName={data.profile?.full_name}
        />
    );
}
