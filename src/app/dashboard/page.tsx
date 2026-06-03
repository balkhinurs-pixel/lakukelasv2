import { getDashboardData, getUserProfile, getHolidays } from '@/lib/data';
import DashboardClientPage from './dashboard-client-page';
import { getIndonesianDayName } from '@/lib/timezone';
import { redirect } from 'next/navigation';

/**
 * Dashboard Page (Server Component) - V121
 * Mengambil data di sisi server untuk menghemat Invocations Vercel.
 */
export default async function DashboardPage() {
    const indonesianDayName = getIndonesianDayName();
    
    // Ambil seluruh data sekaligus di server
    const [dashboardData, profile, holidays] = await Promise.all([
        getDashboardData(indonesianDayName),
        getUserProfile(),
        getHolidays()
    ]);

    if (!profile) {
        redirect('/login');
    }

    return (
        <DashboardClientPage 
            todaySchedule={dashboardData.todaySchedule} 
            agendas={dashboardData.agendas}
            initialAttendancePercentage={dashboardData.attendancePercentage}
            initialUnfilledJournalsCount={dashboardData.unfilledJournalsCount}
            todayHoliday={dashboardData.todayHoliday}
            allHolidays={holidays}
            profileName={profile.full_name}
            driveIntegration={dashboardData.driveIntegration}
            weeklyProgress={dashboardData.weeklyProgress}
        />
    );
}
