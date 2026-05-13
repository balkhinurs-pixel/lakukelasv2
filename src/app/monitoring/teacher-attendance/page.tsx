'use server';

import { getAllUsers, getTeacherAttendanceHistory, getUserProfile, getAdminProfile, getHolidays } from "@/lib/data";
import TeacherAttendanceRecapPageClient from "../../admin/teacher-attendance/teacher-attendance-recap-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Profile } from "@/lib/types";

export default async function MonitoringTeacherAttendancePage() {
    const [attendanceData, allUsers, profile, adminProfile, holidays] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile(),
        getAdminProfile(),
        getHolidays(),
    ]);

    if (!profile) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Gagal memuat profil.</AlertDescription></Alert>;
    }
    
    const usersForFilter = allUsers.filter(u => u.role === 'teacher' || u.role === 'headmaster');

    return (
        <TeacherAttendanceRecapPageClient
            initialHistory={attendanceData}
            users={usersForFilter}
            profile={profile as Profile}
            schoolProfile={adminProfile}
            holidays={holidays}
        />
    );
}
