import { getClasses, getSubjects, getAttendanceHistory, getUserProfile, getActiveStudents, getActiveSchoolYearName, getHolidays } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";

export default async function AttendancePage() {
    const [classes, subjects, history, profile, allStudents, activeSchoolYearName, holidays] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAttendanceHistory(),
        getUserProfile(),
        getActiveStudents(),
        getActiveSchoolYearName(),
        getHolidays(),
    ]);

    return <AttendancePageComponent 
        classes={classes} 
        subjects={subjects} 
        initialHistory={history} 
        allStudents={allStudents}
        activeSchoolYearName={activeSchoolYearName} 
        teacherName={profile?.full_name || "Guru"}
        holidays={holidays}
    />;
}
