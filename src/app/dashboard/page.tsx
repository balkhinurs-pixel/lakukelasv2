
import { getDashboardData } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';

export default async function DashboardPage() {
    const { 
        todaySchedule, 
        journalEntries, 
        attendancePercentage, 
        unfilledJournalsCount 
    } = await getDashboardData();
    
    return (
        <DashboardClientPage 
            todaySchedule={todaySchedule} 
            journalEntries={journalEntries}
            initialAttendancePercentage={attendancePercentage}
            initialUnfilledJournalsCount={unfilledJournalsCount}
        />
    );
}

    
