import { getClasses, getSubjects, getAttendanceHistory } from "@/lib/data";
import AttendancePageComponent from "./attendance-page-component";

export default async function AttendancePage() {
    const [classes, subjects, history] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAttendanceHistory()
    ]);

    return <AttendancePageComponent classes={classes} subjects={subjects} initialHistory={history} />;
}
