
import { getAllUsers, getClasses, getSubjects, getSchedule } from "@/lib/data";
import ScheduleManagementClient from "./schedule-management-client";

export default async function ScheduleManagementPage() {
    const [users, classes, subjects, schedule] = await Promise.all([
        getAllUsers(),
        getClasses(),
        getSubjects(),
        getSchedule(),
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
