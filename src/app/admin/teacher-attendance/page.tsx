
'use server';

import { getAllUsers, getTeacherAttendanceHistory, getUserProfile, getAdminProfile, getHolidays } from "@/lib/data";
import TeacherAttendanceRecapPageClient from "./teacher-attendance-recap-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Profile } from "@/lib/types";

export default async function TeacherAttendanceRecapPage() {
    // Fetch all necessary data on the server
    const [attendanceData, allUsers, profile, adminProfile, holidays] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile(),
        getAdminProfile(),
        getHolidays(),
    ]);

    if (!profile) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal Memuat</AlertTitle>
                <AlertDescription>
                    Tidak dapat memuat profil Anda. Silakan coba lagi.
                </AlertDescription>
            </Alert>
        );
    }
    
    // The list of users for the filter should include all teachers and headmasters
    const usersForFilter = allUsers.filter(u => u.role === 'teacher' || u.role === 'headmaster');

    // Pass the complete data to a client component for interactivity
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
