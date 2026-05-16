
import { getAttendancePageData } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";
import { redirect } from "next/navigation";

export default async function AttendancePage() {
    // Optimized bulk fetcher reduces 14+ queries to ~2 bulk queries.
    const data = await getAttendancePageData();

    if (!data) {
        redirect('/login');
    }

    return <AttendancePageComponent 
        classes={data.classes} 
        subjects={data.subjects} 
        initialHistory={data.history} 
        allStudents={data.allStudents}
        activeSchoolYearName={data.activeSchoolYearName} 
        teacherName={data.profile?.full_name || "Guru"}
        holidays={data.holidays}
        teacherSchedule={data.schedule}
    />;
}
