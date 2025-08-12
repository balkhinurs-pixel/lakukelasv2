
import { getClasses, getSubjects, getAttendanceHistory, getUserProfile } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";

export default async function AttendancePage() {
    const [classes, subjects, history, profile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAttendanceHistory(),
        getUserProfile()
    ]);

    const activeSchoolYearName = profile?.active_school_year_name || "Belum Diatur";

    return <AttendancePageComponent classes={classes} subjects={subjects} initialHistory={history} activeSchoolYearName={activeSchoolYearName} />;
}
