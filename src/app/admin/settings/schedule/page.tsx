
import { getAllUsers, getClasses, getAllSubjects, getAllSchedules } from "@/lib/data";
import ScheduleManagementClient from "./schedule-management-client";

export default async function ScheduleManagementPage() {
    const [users, classes, subjects, schedule] = await Promise.all([
        getAllUsers(),
        getClasses(),
        getAllSubjects(), // Corrected: Use getAllSubjects to fetch all subjects for admin
        getAllSchedules(), // Use getAllSchedules for admin panel
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
