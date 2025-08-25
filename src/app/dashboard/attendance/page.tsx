
import { getClasses, getSubjects, getAttendanceHistory, getUserProfile, getActiveStudents } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";

export default async function AttendancePage() {
    const [classes, subjects, history, profile, allStudents] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAttendanceHistory(),
        getUserProfile(),
        getActiveStudents(),
    ]);

    const activeSchoolYearName = profile?.active_school_year_name || "Belum Diatur";

    return <AttendancePageComponent 
        classes={classes} 
        subjects={subjects} 
        initialHistory={history} 
        allStudents={allStudents}
        activeSchoolYearName={activeSchoolYearName} 
    />;
}
