
import { getTeacherAttendanceHistory, getAllUsers, getUserProfile, getHolidays, getAttendanceSettings, getSchedule } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import { format } from "date-fns";
import { getIndonesianTime, getIndonesianDayName } from "@/lib/timezone";
import type { Holiday } from "@/lib/types";

export default async function TeacherAttendancePage() {
    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');
    const dayNameIndo = getIndonesianDayName();
    
    const [initialAttendanceHistory, users, profile, holidays, settings, schedule] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile(),
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

    // Filter riwayat untuk user ini saja
    const userHistory = profile ? initialAttendanceHistory.filter(h => h.teacherId === profile.id) : [];

    return (
        <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 bg-slate-50">
            <TeacherAttendanceClient 
                initialHistory={userHistory} 
                users={users} 
                profile={profile}
                todayHoliday={todayHoliday}
            />
        </div>
    );
}
