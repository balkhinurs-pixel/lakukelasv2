
import { getAllClasses, getActiveStudents } from "@/lib/data";
import StudentsPageComponent from './students-page-component';

export default async function StudentsPage() {
    const [classes, students] = await Promise.all([
        getAllClasses(),
        getActiveStudents()
    ]);
    return <StudentsPageComponent initialClasses={classes} initialStudents={students} />;
}
