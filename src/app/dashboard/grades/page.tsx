import { getClasses, getSubjects, getGradeHistory, getAllStudents } from "@/lib/data";
import GradesPageComponent from "./grades-page-component";

export default async function GradesPage() {
    const [classes, subjects, history, allStudents] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGradeHistory(),
        getAllStudents()
    ]);

    return <GradesPageComponent classes={classes} subjects={subjects} initialHistory={history} allStudents={allStudents} />;
}
