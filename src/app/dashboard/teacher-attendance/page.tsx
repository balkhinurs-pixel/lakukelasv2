

import { getTeacherAttendanceHistory, getAllUsers, getUserProfile } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import TeacherAttendanceRecapPage from "../reports/teacher-attendance/page";
import type { Profile } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default async function TeacherAttendancePage() {
    const [initialAttendanceHistory, users, profile] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile()
    ]);

    const teachers = users.filter(u => u.role === 'teacher');
    const userHistory = initialAttendanceHistory.filter(h => h.teacherId === profile?.id);

    const isHeadmaster = profile?.role === 'headmaster';
    const isAdmin = profile?.role === 'admin';

    return (
        <div className="space-y-8">
            <TeacherAttendanceClient initialHistory={userHistory} users={teachers} />
            
            {(isHeadmaster || isAdmin) && (
                <>
                    <Separator className="my-8" />
                    <TeacherAttendanceRecapPage />
                </>
            )}
        </div>
    );
}
