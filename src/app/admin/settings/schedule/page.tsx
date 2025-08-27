
import { getAllUsers, getAllClasses, getAllSubjects, getAllSchedules } from "@/lib/data";
import ScheduleManagementClient from "./schedule-management-client";

export default async function ScheduleManagementPage() {
    const [users, classes, subjects, schedule] = await Promise.all([
        getAllUsers(),
        getAllClasses(), // Corrected: Use getAllClasses to fetch all classes for admin
        getAllSubjects(),
        getAllSchedules(),
    ]);

    const teachers = users.filter(u => u.role === 'teacher');

    return (
        <ScheduleManagementClient
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            initialSchedule={schedule}
        />
    )
}
