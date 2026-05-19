
import { ClassSettingsPageComponent } from "./class-settings-page";
import { getAllClasses, getAllUsers, getAllStudents } from "@/lib/data";

export default async function ClassSettingsPage() {
    // Memanggil fungsi getAllStudents yang baru ditambahkan ke lib/data.ts
    const [classes, users, students] = await Promise.all([
        getAllClasses(),
        getAllUsers(),
        getAllStudents()
    ]);

    const teachers = users.filter(u => u.role === 'teacher');
    
    // Join teacher name into classes data
    const classesWithTeacherNames = classes.map(c => {
        const teacher = teachers.find(t => t.id === c.teacher_id);
        return {
            ...c,
            teacher_name: teacher ? teacher.full_name : null,
        }
    });

    return <ClassSettingsPageComponent 
        initialClasses={classesWithTeacherNames} 
        teachers={teachers}
        students={students}
    />;
}
