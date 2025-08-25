
import { getClasses, getSubjects, getAttendanceHistory, getUserProfile, getActiveStudents, getActiveSchoolYearName } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";

export default async function AttendancePage() {
    const [classes, subjects, history, profile, allStudents, activeSchoolYearName] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAttendanceHistory(),
        getUserProfile(),
        getActiveStudents(),
        getActiveSchoolYearName(),
    ]);

    return <AttendancePageComponent 
        classes={classes} 
        subjects={subjects} 
        initialHistory={history} 
        allStudents={allStudents}
        activeSchoolYearName={activeSchoolYearName} 
    />;
}
