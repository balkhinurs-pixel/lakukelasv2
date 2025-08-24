
import { getAttendanceSettings } from "@/lib/data";
import LocationSettingsClient from "./location-settings-client";

export default async function LocationSettingsPage() {
    const attendanceSettings = await getAttendanceSettings();
    
    return <LocationSettingsClient initialSettings={attendanceSettings} />;
}
