
import { getTeacherAttendanceHistory, getAllUsers, getUserProfile } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import type { Profile } from "@/lib/types";

export default async function TeacherAttendancePage() {
    const [initialAttendanceHistory, users, profile] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile()
    ]);

    // This is for the personal attendance client. It only needs the user's own history.
    const userHistory = profile ? initialAttendanceHistory.filter(h => h.teacherId === profile.id) : [];

    return (
        <div className="space-y-8">
            {/* This component is for ALL users to do their personal attendance */}
            <TeacherAttendanceClient initialHistory={userHistory} users={users} />
        </div>
    );
}
