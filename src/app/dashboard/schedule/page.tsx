
import { getSchedule, getClasses, getSubjects } from "@/lib/data";
import SchedulePageComponent from "./schedule-page-component";

export default async function SchedulePage() {
    const [schedule, classes, subjects] = await Promise.all([
        getSchedule(),
        getClasses(),
        getSubjects()
    ]);
    return <SchedulePageComponent initialSchedule={schedule} classes={classes} subjects={subjects} />;
}

    