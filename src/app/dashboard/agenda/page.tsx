
import { getAgendas } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";

async function getIndonesianHolidays() {
    try {
        const nowIndo = getIndonesianTime();
        const year = nowIndo.getFullYear();
        
        // Fetch current and next year to cover planning
        const [thisYearRes, nextYearRes] = await Promise.all([
            fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, { 
                next: { revalidate: 86400 },
                headers: { 'Accept': 'application/json' }
            }),
            fetch(`https://api-hari-libur.vercel.app/api?year=${year + 1}`, { 
                next: { revalidate: 86400 },
                headers: { 'Accept': 'application/json' }
            })
        ]);
        
        const thisYearData = thisYearRes.ok ? await thisYearRes.json() : [];
        const nextYearData = nextYearRes.ok ? await nextYearRes.json() : [];
        
        const allData = [
            ...(Array.isArray(thisYearData) ? thisYearData : []),
            ...(Array.isArray(nextYearData) ? nextYearData : [])
        ];

        // Map data supporting various API formats (date/holiday_date and name/holiday_name)
        return allData.map((h: any) => ({
            date: h.date || h.holiday_date,
            name: h.name || h.holiday_name,
            is_holiday: h.is_holiday !== undefined ? h.is_holiday : true
        })).filter(h => !!h.date); // Ensure date exists
        
    } catch (error) {
        console.error("Failed to fetch holidays:", error);
        return [];
    }
}

export default async function AgendaPage() {
    const [agendas, holidays] = await Promise.all([
        getAgendas(),
        getIndonesianHolidays()
    ]);

    return <AgendaPageClient initialAgendas={agendas} indonesianHolidays={holidays} />;
}
