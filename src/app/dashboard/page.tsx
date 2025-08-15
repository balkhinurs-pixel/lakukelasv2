import { getDashboardData } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';
import type { ScheduleItem, JournalEntry } from "@/lib/types";

type DashboardData = {
    todaySchedule: ScheduleItem[];
    journalEntries: JournalEntry[];
    attendancePercentage: number;
    unfilledJournalsCount: number;
};

export default async function DashboardPage() {
    const data: DashboardData = await getDashboardData();
    
    return (
        <DashboardClientPage 
            todaySchedule={data.todaySchedule} 
            journalEntries={data.journalEntries}
            initialAttendancePercentage={data.attendancePercentage}
            initialUnfilledJournalsCount={data.unfilledJournalsCount}
        />
    );
}

    
