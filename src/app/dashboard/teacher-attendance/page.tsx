import { getTeacherAttendanceHistory, getAllUsers } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import type { TeacherAttendance, Profile } from "@/lib/types";

export default async function TeacherAttendancePage() {
    const [initialAttendanceHistory, users] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
    ]);

    const teachers = users.filter(u => u.role === 'teacher');

    return <TeacherAttendanceClient initialHistory={initialAttendanceHistory} users={teachers} />;
}
