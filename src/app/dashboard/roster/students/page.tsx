
import { getClasses, getActiveStudents } from "@/lib/data";
import StudentsPageComponent from './students-page-component';

export default async function StudentsPage() {
    const [classes, students] = await Promise.all([
        getClasses(),
        getActiveStudents()
    ]);
    return <StudentsPageComponent initialClasses={classes} initialStudents={students} />;
}
