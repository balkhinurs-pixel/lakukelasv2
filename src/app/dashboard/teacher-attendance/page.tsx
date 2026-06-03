import { getTeacherAttendanceHistory, getUserProfile, getHolidays, getAttendanceSettings, getSchedule } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import { format } from "date-fns";
import { getIndonesianTime, getIndonesianDayName } from "@/lib/timezone";
import type { Holiday } from "@/lib/types";
import { redirect } from "next/navigation";

/**
 * Page Teacher Attendance (Server Component) - V122
 * Optimized: Only fetches personal records to save Invocations/CPU.
 */
export default async function TeacherAttendancePage() {
    const profile = await getUserProfile();
    
    if (!profile) {
        redirect('/login');
    }

    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');
    const dayNameIndo = getIndonesianDayName();
    
    // Targeted Fetching: Pass profile.id to get only this teacher's history
    const [initialAttendanceHistory, holidays, settings, schedule] = await Promise.all([
        getTeacherAttendanceHistory(profile.id),
        getHolidays(),
        getAttendanceSettings(),
        getSchedule()
    ]);

    // 1. Cek Libur dari Database (Nasional/Sekolah)
    let todayHoliday: Holiday | null = holidays.find(h => h.date === todayStr) || null;

    // 2. Cek Libur Rutin (Hari Minggu)
    if (!todayHoliday && nowIndo.getDay() === 0) {
        todayHoliday = {
            id: 'sunday',
            date: todayStr,
            description: "Hari Minggu - Waktunya Istirahat",
            type: 'school'
        };
    }

    // 3. Cek Libur karena Tidak Ada Jadwal (Jika kebijakan schedule_based)
    if (!todayHoliday && settings.attendance_policy === 'schedule_based') {
        const hasScheduleToday = schedule.some(item => item.day === dayNameIndo);
        if (!hasScheduleToday) {
            todayHoliday = {
                id: 'no-schedule',
                date: todayStr,
                description: "Tidak Ada Jadwal Mengajar Hari Ini",
                type: 'school'
            };
        }
    }

    return (
        <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 bg-slate-50">
            <TeacherAttendanceClient 
                initialHistory={initialAttendanceHistory} 
                profile={profile}
                todayHoliday={todayHoliday}
            />
        </div>
    );
}
