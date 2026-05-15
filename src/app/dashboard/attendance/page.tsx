import { getClasses, getSubjects, getAttendanceHistory, getUserProfile, getActiveStudents, getActiveSchoolYearName, getHolidays, getSchedule } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";

export default async function AttendancePage() {
    const [classes, subjects, history, profile, allStudents, activeSchoolYearName, holidays, schedule] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAttendanceHistory(),
        getUserProfile(),
        getActiveStudents(),
        getActiveSchoolYearName(),
        getHolidays(),
        getSchedule(),
    ]);

    return <AttendancePageComponent 
        classes={classes} 
        subjects={subjects} 
        initialHistory={history} 
        allStudents={allStudents}
        activeSchoolYearName={activeSchoolYearName} 
        teacherName={profile?.full_name || "Guru"}
        holidays={holidays}
        teacherSchedule={schedule}
    />;
}
