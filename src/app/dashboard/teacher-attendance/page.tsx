
import { getTeacherAttendanceHistory, getAllUsers, getUserProfile } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import TeacherAttendanceRecapPage from "../../admin/teacher-attendance/page";
import type { Profile } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default async function TeacherAttendancePage() {
    const [initialAttendanceHistory, users, profile] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile()
    ]);

    // This is for the personal attendance client
    const userHistory = profile ? initialAttendanceHistory.filter(h => h.teacherId === profile.id) : [];

    const isHeadmaster = profile?.role === 'headmaster';
    const isAdmin = profile?.role === 'admin';

    return (
        <div className="space-y-8">
            {/* This component is for ALL users to do their personal attendance */}
            <TeacherAttendanceClient initialHistory={userHistory} users={users} />
            
            {/* This section is ONLY for headmaster/admin to see the recap */}
            {(isHeadmaster || isAdmin) && (
                <>
                    <Separator className="my-8" />
                    <TeacherAttendanceRecapPage />
                </>
            )}
        </div>
    );
}
