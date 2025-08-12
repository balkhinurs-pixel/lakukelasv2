
import { getClasses, getSubjects, getGradeHistory, getAllStudents, getUserProfile } from "@/lib/data";
import GradesPageComponent from "./grades-page-component";

export default async function GradesPage() {
    const [classes, subjects, history, allStudents, profile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGradeHistory(),
        getAllStudents(),
        getUserProfile()
    ]);

    const activeSchoolYearName = profile?.active_school_year_name || "Belum Diatur";

    return <GradesPageComponent classes={classes} subjects={subjects} initialHistory={history} allStudents={allStudents} activeSchoolYearName={activeSchoolYearName} />;
}
