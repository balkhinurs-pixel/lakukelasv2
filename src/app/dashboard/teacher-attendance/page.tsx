import { getTeacherAttendanceHistory } from "@/lib/data";
import TeacherAttendanceClient from "./attendance-client";
import type { TeacherAttendance } from "@/lib/types";

export default async function TeacherAttendancePage() {
    const initialAttendanceHistory: TeacherAttendance[] = await getTeacherAttendanceHistory();

    return <TeacherAttendanceClient initialHistory={initialAttendanceHistory} />;
}
