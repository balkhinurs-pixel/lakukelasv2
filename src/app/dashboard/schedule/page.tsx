
import { getSchedule } from "@/lib/data";
import SchedulePageComponent from "./schedule-page-component";

export default async function SchedulePage() {
    const schedule = await getSchedule();
    return <SchedulePageComponent initialSchedule={schedule} />;
}
