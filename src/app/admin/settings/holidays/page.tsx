
import { getHolidays } from "@/lib/data";
import HolidaysClientPage from "./holidays-client";

export default async function HolidaysPage() {
    const holidays = await getHolidays();
    return <HolidaysClientPage initialHolidays={holidays} />;
}
