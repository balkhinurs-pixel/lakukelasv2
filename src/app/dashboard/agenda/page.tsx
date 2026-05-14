
import { getAgendas } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";

async function getIndonesianHolidays() {
    try {
        const year = new Date().getFullYear();
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

        return allData.map((h: any) => ({
            date: h.holiday_date,
            name: h.holiday_name,
            is_holiday: h.is_holiday
        }));
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
