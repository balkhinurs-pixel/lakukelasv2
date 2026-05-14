
import { getTeacherAttendanceHistory, getAllUsers, getUserProfile, getHolidays } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import { format } from "date-fns";
import { getIndonesianTime } from "@/lib/timezone";

export default async function TeacherAttendancePage() {
    const todayStr = format(getIndonesianTime(), 'yyyy-MM-dd');
    
    const [initialAttendanceHistory, users, profile, holidays] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile(),
        getHolidays()
    ]);

    // Ambil info libur hari ini
    const todayHoliday = holidays.find(h => h.date === todayStr) || null;

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
