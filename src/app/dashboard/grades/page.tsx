
import { getClasses, getSubjects, getGradeHistory, getAllStudents, getUserProfile, getActiveSchoolYearName } from "@/lib/data";
import GradesPageComponent from "./grades-page-component";

export default async function GradesPage() {
    const [classes, subjects, history, allStudents, profile, activeSchoolYearName] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGradeHistory(),
        getAllStudents(),
        getUserProfile(),
        getActiveSchoolYearName()
    ]);

    return <GradesPageComponent classes={classes} subjects={subjects} initialHistory={history} allStudents={allStudents} activeSchoolYearName={activeSchoolYearName} />;
}
