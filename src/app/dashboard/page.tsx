import { getDashboardData } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';
import type { ScheduleItem, JournalEntry } from "@/lib/types";
import { cookies } from 'next/headers';

type DashboardData = {
    todaySchedule: ScheduleItem[];
    journalEntries: JournalEntry[];
    attendancePercentage: number;
    unfilledJournalsCount: number;
};

export default async function DashboardPage() {
    const cookieStore = cookies();
    const userTimeZone = cookieStore.get('timezone')?.value || 'Asia/Jakarta'; // Default to Jakarta if not found

    const data: DashboardData = await getDashboardData(userTimeZone);
    
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
